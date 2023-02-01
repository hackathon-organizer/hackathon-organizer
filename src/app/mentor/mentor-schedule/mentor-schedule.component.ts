import {ChangeDetectionStrategy, Component, OnDestroy, OnInit,} from '@angular/core';
import {CalendarEvent, CalendarEventTimesChangedEvent, CalendarView} from "angular-calendar";

import {map, Observable, Subject, Subscription, timer} from "rxjs";
import {EventColor} from 'calendar-utils';
import {UserService} from "../../core/services/user-service/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {NGXLogger} from "ngx-logger";
import {TeamService} from "../../core/services/team-service/team.service";
import {
  ScheduleEntryEvent,
  ScheduleEntryRequest,
  ScheduleEntryResponse,
  ScheduleEntrySession,
  TeamMeetingRequest
} from "../model/ScheduleEntryEvent";
import {ToastrService} from "ngx-toastr";
import {UserManager} from "../../shared/UserManager";
import dayjs from "dayjs";

let colors: Record<string, EventColor> = {
  main: {
    primary: '#58C7F3',
    secondary: '#FAE3E3',
  }
}

@Component({
  selector: 'ho-mentor-schedule',
  templateUrl: './mentor-schedule.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentorScheduleComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();
  view: CalendarView = CalendarView.Day;
  hackathonId?: number;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  refresh = new Subject<void>();
  events: ScheduleEntryEvent[] = [];
  userEvents: ScheduleEntryEvent[] = [];
  activeDayIsOpen: boolean = true;
  currentUser = UserManager.currentUserFromLocalStorage;
  modalData: ScheduleEntryEvent = {start: new Date(), isAvailable: false, title: ""};
  currentTime: Observable<Date> = timer(0, 1000).pipe(map(() => new Date()));

  constructor(private userService: UserService,
              private teamService: TeamService,
              private route: ActivatedRoute,
              private router: Router,
              private logger: NGXLogger,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.subscription =

        this.route.params.subscribe(params => {
          this.hackathonId = params["id"];
          this.getHackathonSchedule(this.hackathonId!)
        });

  }

  private getHackathonSchedule(hackathonId: number) {

    this.userService.getHackathonSchedule(hackathonId).subscribe(schedule => {

      this.logger.info("Hackathon schedule received ", schedule);
      this.events = schedule.map(entry => this.mapToCalendarEvent(entry));
      this.userEvents = schedule.filter(entry => entry.userId === this.currentUser.id)
        .map(entry => this.mapToCalendarEvent(entry));

      this.refresh.next();

      console.log(this.events)
      console.log(this.userEvents)

    });
  }

  eventTimesChanged(timesChangedEvent: CalendarEventTimesChangedEvent): void {

    this.events = this.events.map((iEvent) => {
      if (iEvent === timesChangedEvent.event) {

        const updatedScheduleEntrySession: ScheduleEntrySession = {
          sessionStart: timesChangedEvent.newStart,
          sessionEnd: timesChangedEvent.newEnd!
        }
        const eventId = timesChangedEvent.event.id as number;

        this.userService.updateUserScheduleEntryTime(this.currentUser.id, eventId, updatedScheduleEntrySession)
          .subscribe(() => this.scheduleUpdateSuccessToast());

        return {
          ...timesChangedEvent.event,
          start: timesChangedEvent.newStart,
          end: timesChangedEvent.newEnd,
        };
      }
      return iEvent;
    });
  }

  addEvent(): void {

    const entryEvent: ScheduleEntryRequest = {
      sessionStart: dayjs().toDate(),
      sessionEnd: dayjs().add(1, 'hour').toDate(),
      entryColor: colors.main.secondary,
      hackathonId: this.hackathonId ? this.hackathonId : Number(this.currentUser.currentHackathonId)
    };

    this.userService.createEntryEvent(entryEvent).subscribe((entryResponse) => {

      if (entryResponse.entryColor != null) {
        colors.main.secondary = entryResponse.entryColor;
      }

      console.log(entryResponse.userId)

      const entryEvent: ScheduleEntryEvent = {
        id: entryResponse.id,
        title: this.currentUser.username,
        start: dayjs(entryResponse.sessionStart).toDate(),
        end: dayjs(entryResponse.sessionEnd).toDate(),
        color: colors.main,
        draggable: this.currentUser.id === entryResponse.userId,
        resizable: {
          beforeStart: true,
          afterEnd: true,
        },
        isAvailable: entryResponse.isAvailable,
      };

      this.events = [
        ...this.events,
        entryEvent
      ];

      this.userEvents.push(entryEvent);

      this.refresh.next();
      this.scheduleUpdateSuccessToast();
    });
  }

  deleteEvent(eventToDelete: CalendarEvent) {

    this.logger.info("Trying to delete event with id ", eventToDelete.id);

    this.userService.removeScheduleEntry(this.currentUser.id, eventToDelete.id as number)
      .subscribe(() => {

        this.events = this.events.filter((event) => event.id !== eventToDelete.id);
        this.userEvents = this.userEvents.filter((event) => event.id !== eventToDelete.id);
        this.scheduleUpdateSuccessToast();

        this.refresh.next();
      });
  }

  updateEvents(): void {

    const eventsCopy = Object.assign([], this.userEvents);

    const scheduleEntries: ScheduleEntryRequest[] = eventsCopy.map(entry => this.mapToScheduleEntryRequest(entry));

    this.logger.info("Sending schedule to save ", scheduleEntries);

    this.userService.updateEntryEvents(scheduleEntries).subscribe(() => {
      this.events.concat(eventsCopy);

      this.scheduleUpdateSuccessToast();
    });
  }

  private mapToCalendarEvent(entry: ScheduleEntryResponse): ScheduleEntryEvent {

      colors.main = {
        primary: colors.main.primary,
        secondary: entry.entryColor ? entry.entryColor : colors.main.secondary
      }

    return {
        id: entry.id,
        title: entry.username,
        teamId: entry.teamId,
        start: new Date(entry.sessionStart),
        end: new Date(entry.sessionEnd),
        color: colors.main,
        draggable: this.currentUser.id === entry.userId,
        resizable: {
          beforeStart: true,
          afterEnd: true,
        },
        isAvailable: entry.isAvailable,
        info: entry.info,
      } as ScheduleEntryEvent;
  }

  assignTeam(event: ScheduleEntryEvent) {

    const teamId = this.currentUser.currentTeamId;

    if (teamId && this.canAssignTeam()) {

      const teamMeetingRequest: TeamMeetingRequest = {
        teamOwnerId: this.currentUser.id,
        teamId: teamId
      };

      this.userService.assignTeamToMeetingWithMentor(event.id as number, teamMeetingRequest).subscribe((isAvailable) => {

        event.isAvailable = isAvailable;
        this.modalData.teamId = isAvailable ? undefined : teamMeetingRequest.teamId;
        this.refresh.next();
        this.scheduleUpdateSuccessToast();
      });
    }
  }

  private scheduleUpdateSuccessToast() {
    this.toastr.success("Schedule updated successfully");
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  private mapToScheduleEntryRequest(entry: ScheduleEntryEvent): ScheduleEntryRequest {
    return {
      id: entry.id,
      sessionStart: entry.start,
      sessionEnd: entry.end,
      entryColor: colors.main.secondary,
      info: entry.info,
      teamId: entry.teamId,
      hackathonId: entry.hackathonId,
    } as ScheduleEntryRequest;
  }

  handleEvent(event: ScheduleEntryEvent): void {
    this.modalData = event;
  }

  canAssignTeam(): boolean {

    return this.userService.isUserTeamOwnerInHackathon(this.hackathonId!);
  }

  canEditSchedule(): boolean {

    if (this.hackathonId) {
      return this.userService.isUserMentorOrOrganizer(this.hackathonId);
    } else {
      return false;
    }
  }

  joinMeeting(teamId: string | number | undefined) {

    this.router.navigate(["hackathon", this.hackathonId, "team", teamId, "chat"]);
  }

  canJoinToMeeting(teamId: string | number | undefined) {

    if (teamId && UserManager.isUserTeamMember(Number(teamId)) && !this.modalData.isAvailable) {
      return true;
    } else {
      return this.userService.isUserMentorOrOrganizer(this.hackathonId!) && !this.modalData.isAvailable &&
        dayjs().isBetween(dayjs(this.modalData.start).subtract(15, "minutes"), dayjs(this.modalData.end));
    }
  }

  get showEvent(): boolean {
    return dayjs(this.modalData.start).isBefore(dayjs());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.refresh.unsubscribe();
  }
}
