import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef, OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarView} from "angular-calendar";
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
} from 'date-fns';
import {map, Subject, Subscription} from "rxjs";
import {EventColor} from 'calendar-utils';
import {UserService} from "../../core/services/user-service/user.service";
import {MentorModule} from "../mentor.module";
import {ActivatedRoute} from "@angular/router";
import {NGXLogger} from "ngx-logger";
import {User} from "../../user/model/User";
import {TeamService} from "../../core/services/team-service/team.service";
import {
  ScheduleEntryEvent,
  ScheduleEntryRequest,
  ScheduleEntryResponse,
  TeamMeetingRequest
} from "../model/ScheduleEntryEvent";
import {ScheduleEntrySession} from "../model/ScheduleEntrySession";
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

        this.route.params.subscribe(params => this.getHackathonSchedule(params["id"] as number));
      } else {
        this.getUserSchedule();
      }
    });
  }

  private getHackathonSchedule(hackathonId: number) {
    this.userService.getHackathonSchedule(hackathonId).subscribe(schedule => {

      this.logger.info("Hackathon hackathons schedule received ", schedule)

      this.mapToCalendarEvents(schedule);
    });
  }

  private getUserSchedule() {
    this.userService.getUserSchedule(this.currentUser.currentHackathonId).subscribe(schedule => {

      this.logger.info("User schedule received ", schedule)

      this.mapToCalendarEvents(schedule);
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

    const entryEvent: ScheduleEntryEvent = {
      title: this.currentUser.username,
      start: dayjs().toDate(),
      end: dayjs().add(1, 'hour').toDate(),
      color: colors.main,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      isAvailable: true,
    };

    const newEvent = this.mapToScheduleEntryRequest(entryEvent);

    this.userService.createEntryEvent(newEvent).subscribe(() => {

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
      });
  }

  updateEvents(): void {

    const scheduleEntries: ScheduleEntryRequest[] = this.events.map(entry => this.mapToScheduleEntryRequest(entry));

    this.logger.info("Sending schedule to save ", scheduleEntries);

    this.userService.updateEntryEvents(this.currentUser.id, scheduleEntries).subscribe(() => this.scheduleUpdateSuccessToast());
  }

  private mapToCalendarEvents(entries: ScheduleEntryResponse[]): void {

    entries.map(entry => {

    this.userService.getUserById(entry.userId).subscribe(
     userResponse => {

       colors.main = {
         primary: colors.main.primary,
         secondary: entry.entryColor ? entry.entryColor : colors.main.secondary
       }

       this.events.push({
         id: entry.id,
         title: userResponse.username,
         start: new Date(entry.sessionStart),
         end: new Date(entry.sessionEnd),
         color: colors.main,
         draggable: true,
         resizable: {
           beforeStart: true,
           afterEnd: true,
         },
         isAvailable: entry.isAvailable,
         info: entry.info,
       } as ScheduleEntryEvent)

       this.refresh.next();
     })
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
}
