import {
  ChangeDetectionStrategy,
  Component,
  ElementRef, OnDestroy,
  OnInit,
} from '@angular/core';
import {CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarView} from "angular-calendar";

import {Subject, Subscription} from "rxjs";
import {EventColor} from 'calendar-utils';
import {UserService} from "../../core/services/user-service/user.service";
import {ActivatedRoute} from "@angular/router";
import {NGXLogger} from "ngx-logger";
import {TeamService} from "../../core/services/team-service/team.service";
import {
  ScheduleEntryEvent,
  ScheduleEntryRequest,
  ScheduleEntryResponse, ScheduleEntrySession,
  TeamMeetingRequest
} from "../model/ScheduleEntryEvent";
import {ToastrService} from "ngx-toastr";
import {Utils} from "../../shared/Utils";
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

  private routeSubscription: Subscription = new Subscription();
  view: CalendarView = CalendarView.Day;
  hackathonId: number = 0;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  refresh = new Subject<void>();
  events: ScheduleEntryEvent[] = [];
  activeDayIsOpen: boolean = true;
  currentUser = Utils.currentUserFromLocalStorage;
  modalData: ScheduleEntryEvent = {start: new Date(), isAvailable: false, title: ""};

  constructor(private userService: UserService,
              private teamService: TeamService,
              private route: ActivatedRoute,
              private logger: NGXLogger,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.queryParams.subscribe(params => {

      if (params['hackathonView'] === "1") {

        this.route.params.subscribe(params => {
          this.hackathonId = params["id"];
          this.getHackathonSchedule(this.hackathonId)
        });
      } else {
        this.getUserSchedule();
      }
    });
  }

  private getHackathonSchedule(hackathonId: number) {
    this.userService.getHackathonSchedule(hackathonId).subscribe(schedule => {

      this.logger.info("Hackathon schedule received ", schedule)

      this.mapToCalendarEvents(schedule);
    });
  }

  private getUserSchedule() {

    if (this.currentUser.currentHackathonId){
      this.userService.getUserSchedule(this.currentUser.currentHackathonId).subscribe(schedule => {

        this.logger.info("User schedule received ", schedule)

        this.mapToCalendarEvents(schedule);
      });
    } else {
      this.logger.info("User is not a hackathon participant");
    }
  }

  eventTimesChanged(timesChangedEvent: CalendarEventTimesChangedEvent): void {

    this.events = this.events.map((iEvent) => {
      if (iEvent === timesChangedEvent.event) {

        const updatedScheduleEntrySession: ScheduleEntrySession = {
            sessionStart: timesChangedEvent.newStart,
            sessionEnd: timesChangedEvent.newEnd!
        }
        const eventId = timesChangedEvent.event.id as number;

        this.userService.updateUserScheduleEntry(this.currentUser.id, eventId, updatedScheduleEntrySession)
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
      hackathonId: this.hackathonId
    };

    console.log(entryEvent)

    this.userService.createEntryEvent(entryEvent).subscribe((entryResponse) => {

      if (entryResponse.entryColor != null) {
        colors.main.secondary = entryResponse.entryColor;
      }

      const entryEvent: ScheduleEntryEvent = {
        id: entryResponse.id,
        title: this.currentUser.username,
        start: dayjs(entryResponse.sessionStart).toDate(),
        end: dayjs(entryResponse.sessionEnd).toDate(),
        color: colors.main,
        draggable: true,
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

        this.refresh.next();
        this.scheduleUpdateSuccessToast();
      });
  }

  deleteEvent(eventToDelete: CalendarEvent) {

    this.logger.info("Trying to delete event with id ", eventToDelete.id);

    this.userService.removeScheduleEntry(this.currentUser.id, eventToDelete.id as number)
      .subscribe(() => {

        this.events = this.events.filter((event) => event !== eventToDelete);
        this.scheduleUpdateSuccessToast()

        this.refresh.next();
      });
  }

  updateEvents(): void {

    const eventsCopy = Object.assign([], this.events);

    const scheduleEntries: ScheduleEntryRequest[] = eventsCopy.map(entry => this.mapToScheduleEntryRequest(entry));

    this.logger.info("Sending schedule to save ", scheduleEntries);

    this.userService.updateEntryEvents(this.currentUser.id, scheduleEntries).subscribe(() => {
      this.events = eventsCopy;

      this.scheduleUpdateSuccessToast()
    });
  }

  private mapToCalendarEvents(entries: ScheduleEntryResponse[]): void {

    entries.map(entry => {

      console.log(entry)

       colors.main = {
         primary: colors.main.primary,
         secondary: entry.entryColor ? entry.entryColor : colors.main.secondary
       }

       this.events.push({
         id: entry.id,
         title: entry.username,
         start: new Date(entry.sessionStart),
         end: new Date(entry.sessionEnd),
         color: colors.main,
         draggable: this.canEditSchedule(),
         resizable: {
           beforeStart: true,
           afterEnd: true,
         },
         isAvailable: entry.isAvailable,
         info: entry.info,
       } as ScheduleEntryEvent)

       this.refresh.next();
    });
  }

  assignTeam(event: ScheduleEntryEvent) {

    const teamId = this.currentUser.currentTeamId;

    if (teamId && this.isUserTeamOwner()) {

      const teamMeetingRequest: TeamMeetingRequest = {
        teamOwnerId: this.currentUser.id,
        teamId: teamId
      };

      this.userService.assignTeamToMeetingWithMentor(event.id as number, teamMeetingRequest).subscribe((isAvailable) => {

            event.isAvailable = isAvailable;
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

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    this.refresh.unsubscribe();
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

  handleEvent(event: CalendarEvent): void {
    this.modalData = event;
  }

  isUserTeamOwner(): boolean {
    return Utils.isUserTeamOwner();
  }

  canEditSchedule(): boolean {
    return this.userService.checkUserAccess;
  }
}
