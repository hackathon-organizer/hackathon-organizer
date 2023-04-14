import {ChangeDetectionStrategy, Component, OnDestroy, OnInit,} from '@angular/core';
import {CalendarEvent, CalendarEventTimesChangedEvent, CalendarView} from "angular-calendar";

import {map, Observable, Subject, Subscription, timer} from "rxjs";
import {EventColor} from 'calendar-utils';
import {UserService} from "../../core/services/user-service/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {NGXLogger} from "ngx-logger";
import {TeamService} from "../../core/services/team-service/team.service";
import {
  ScheduleEntry,
  ScheduleEntryRequest,
  ScheduleEntryResponse,
  ScheduleEntrySession,
  TeamMeetingRequest
} from "../model/ScheduleEntry";
import {ToastrService} from "ngx-toastr";
import {UserManager} from "../../shared/UserManager";
import dayjs from "dayjs";
import {Role} from "../../user/model/Role";

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

  view: CalendarView = CalendarView.Day;
  hackathonId?: number;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  refresh = new Subject<void>();
  events: ScheduleEntry[] = [];
  userEvents: ScheduleEntry[] = [];
  activeDayIsOpen: boolean = true;
  currentUser = UserManager.currentUserFromStorage;
  modalData: ScheduleEntry = {start: new Date(), isAvailable: false, title: ""};
  currentTime: Observable<Date> = timer(0, 1000).pipe(map(() => new Date()));
  loading = false;
  private subscription: Subscription = new Subscription();

  constructor(private userService: UserService,
              private teamService: TeamService,
              private route: ActivatedRoute,
              private router: Router,
              private logger: NGXLogger,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.subscription = this.route.params.subscribe(params => {
      this.hackathonId = params["id"];
      this.getHackathonSchedule(this.hackathonId!);
    });
  }

  eventTimeChange(timeChangeEvent: CalendarEventTimesChangedEvent): void {

    this.events = this.events.map((scheduleEntryEvent) => {
      if (scheduleEntryEvent === timeChangeEvent.event) {

        const updatedScheduleEntrySession: ScheduleEntrySession = {
          sessionStart: timeChangeEvent.newStart!,
          sessionEnd: timeChangeEvent.newEnd!,
          hackathonId: this.hackathonId!
        }
        const eventId = timeChangeEvent.event.id as number;

        this.userService.updateUserScheduleEntryTime(this.currentUser.id, eventId, updatedScheduleEntrySession)
          .subscribe(() => this.scheduleUpdateSuccessToast());

        scheduleEntryEvent.start = timeChangeEvent.newStart;
        scheduleEntryEvent.end = timeChangeEvent.newEnd;

        this.updateUserEvent(scheduleEntryEvent);
      }
      return scheduleEntryEvent;
    });

    this.refresh.next();
  }

  updateUserEvent(entryEvent: ScheduleEntry): void {
    let event = this.userEvents.find(event => event.id === entryEvent.id);

    if (event) {
      event.start = entryEvent.start;
      event.end = entryEvent.end;
    }
  }

  addEvent(): void {

    this.loading = true;

    const entryEvent: ScheduleEntryRequest = {
      sessionStart: dayjs().add(1, 'hour').toISOString(),
      sessionEnd: dayjs().add(2, 'hour').toISOString(),
      entryColor: colors.main.secondary,
      hackathonId: this.hackathonId ? this.hackathonId : Number(this.currentUser.currentHackathonId)
    };

    this.userService.createEntryEvent(entryEvent).subscribe((entryResponse) => {

      if (entryResponse.entryColor != null) {
        colors.main.secondary = entryResponse.entryColor;
      }

      const entryEvent: ScheduleEntry = {
        id: entryResponse.id,
        title: this.currentUser.username,
        start: new Date(dayjs(entryResponse.sessionStart).toISOString()),
        end: new Date(dayjs(entryResponse.sessionEnd).toISOString()),
        color: colors.main,
        draggable: this.currentUser?.id === entryResponse.userId,
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
      this.loading = false;
      this.scheduleUpdateSuccessToast();
    });
  }

  deleteEvent(eventToDelete: CalendarEvent): void {

    this.loading = true;

    this.userService.removeScheduleEntry(this.currentUser.id, eventToDelete.id as number).subscribe(() => {

      this.events = this.events.filter((event) => event.id !== eventToDelete.id);
      this.userEvents = this.userEvents.filter((event) => event.id !== eventToDelete.id);
      this.scheduleUpdateSuccessToast();

      this.refresh.next();
      this.loading = false;
    });
  }

  updateEvents(): void {

    this.loading = true;

    const scheduleEntries: ScheduleEntryRequest[] = this.userEvents.map(event => {

      const idx = this.events.findIndex(e => e.id === event.id);
      this.events[idx] = event;

      return this.mapToScheduleEntryRequest(event)
    });

    this.userService.updateEntryEvents(scheduleEntries).subscribe(() => {

      this.loading = false;
      this.scheduleUpdateSuccessToast();
      this.refresh.next();
    });
  }

  assignTeam(event: ScheduleEntry): void {

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

  handleEvent(event: ScheduleEntry): void {
    this.modalData = event;
  }

  canAssignTeam(): boolean {

    if (this.hackathonId) {
      return this.userService.checkUserAccessAndMembership(this.hackathonId, Role.TEAM_OWNER);
    } else {
      return false;
    }
  }

  canEditSchedule(): boolean {
      return this.checkIfUserIsMentorOrOrganizer();
  }

  navigateToMeeting(teamId: string | number | undefined): void {

    if (teamId) {
      this.router.navigate(["hackathon", this.hackathonId, "team", teamId, "chat"]);
    }
  }

  canJoinToMeeting(teamId: string | number | undefined): boolean {

    if (teamId && UserManager.isUserTeamMember(Number(teamId)) && !this.modalData.isAvailable) {
      return true;
    } else {
      return this.checkIfUserIsMentorOrOrganizer() && !this.modalData.isAvailable &&
        dayjs().isBetween(dayjs(this.modalData.start).subtract(15, "minutes"), dayjs(this.modalData.end));
    }
  }

  private getHackathonSchedule(hackathonId: number): void {

    this.userService.getHackathonSchedule(hackathonId).subscribe(schedule => {

      this.events = schedule.map(entry => this.mapToCalendarEvent(entry));

      if (this.currentUser) {
        this.userEvents = schedule.filter(entry => entry.userId === this.currentUser.id)
          .map(entry => this.mapToCalendarEvent(entry));
      }

      this.refresh.next();
    });
  }

  private mapToCalendarEvent(entry: ScheduleEntryResponse): ScheduleEntry {

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
      draggable: this.currentUser?.id === entry.userId,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      isAvailable: entry.isAvailable,
      info: entry.info,
    } as ScheduleEntry;
  }


  private mapToScheduleEntryRequest(entry: ScheduleEntry): ScheduleEntryRequest {

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

  get showEvent(): boolean {
    return dayjs(this.modalData.start).isBefore(dayjs());
  }

  setView(view: CalendarView): void {
    this.view = view;
  }

  private scheduleUpdateSuccessToast(): void {
    this.toastr.success("Schedule updated successfully");
  }

  private checkIfUserIsMentorOrOrganizer(): boolean {

    if (this.hackathonId) {
      return this.userService.checkUserAccessAndMembership(this.hackathonId, Role.MENTOR) ||
        this.userService.checkUserAccess(Role.ORGANIZER);
    } else {
      return false;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.refresh.unsubscribe();
  }
}
