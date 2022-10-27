import {ChangeDetectionStrategy, Component, ElementRef, OnInit, TemplateRef, ViewChild} from '@angular/core';
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
import {Subject, Subscription} from "rxjs";
import { EventColor } from 'calendar-utils';
import {UserService} from "../../core/services/user-service/user.service";
import {MentorModule} from "../mentor.module";
import {ActivatedRoute} from "@angular/router";
import {MentorScheduleEntry} from "../model/MentorScheduleEntry";
import {NGXLogger} from "ngx-logger";
import {User} from "../../user/model/User";
import {TeamService} from "../../core/services/team-service/team.service";
import {ScheduleEntryEvent} from "../../user/model/ScheduleEntryEvent";

const colors: Record<string, EventColor> = {
  main: {
    primary: '#58C7F3',
    secondary: '#FAE3E3',
  },
};

@Component({
  selector: 'ho-mentor-schedule',
  templateUrl: './mentor-schedule.component.html',
  styleUrls: ['./mentor-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentorScheduleComponent {


  constructor(private userService: UserService, private teamService: TeamService,
              private route: ActivatedRoute, private logger: NGXLogger) {


    this.routeSubscription = this.route.queryParams.subscribe(params => {

      if (params['hackathonView'] === "1") {

        this.getHackathonSchedule()

      } else {

        this.getUserSchedule();
      }
    });
  }

  private getUserSchedule() {
    this.userService.getUserSchedule().subscribe(schedule => {

      this.logger.info("User schedule received", schedule)

      this.events = schedule.map(s => this.mapToCalendarEvent(s));

      this.refresh.next();
    });
  }

  private getHackathonSchedule() {
    this.userService.getUsersHackathonSchedule().subscribe(schedule => {

      this.logger.info("Users hackathons schedule received", schedule)

      this.events = schedule.map(s => this.mapToCalendarEvent(s));

      this.refresh.next();
    });
  }

  private routeSubscription: Subscription = new Subscription();

  view: CalendarView = CalendarView.Day;

  CalendarView = CalendarView;

  viewDate: Date = new Date();

  refresh = new Subject<void>();

  events: CalendarEvent[] = [];

  activeDayIsOpen: boolean = true;

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen) || events.length === 0) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  eventTimesChanged({
                      event,
                      newStart,
                      newEnd,
                    }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });
  }

  addEvent(): void {
    this.events = [
      ...this.events,
      {
        title: localStorage.getItem("username"),
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
        color: colors.main,
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true,
        },
        isAvailable: true
      } as ScheduleEntryEvent,
    ];
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    this.events = this.events.filter((event) => event !== eventToDelete);
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  saveEvents(): void {

      const scheduleEntries: MentorScheduleEntry[] = this.events.map(event => this.mapToMentorSchedule(event));

      this.logger.info("Sending schedule to save", scheduleEntries);

      this.userService.saveMentorSchedule(scheduleEntries).subscribe();
  }

  private mapToMentorSchedule(x: CalendarEvent): MentorScheduleEntry {
    return {
      sessionStart: x.start,
      sessionEnd: x.end,
      userId: this.userService.getUserId(),
      hackathonId: 1,
      info: "test"
    } as MentorScheduleEntry;
  }

  private mapToCalendarEvent(x: MentorScheduleEntry): ScheduleEntryEvent {
    return {
      title: "John Doe",
      start: new Date(x.sessionStart),
      end: new Date(x.sessionEnd),
      color: x.entryColor ? x.entryColor : colors.main,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: false,
      },
      isAvailable: true
    } as ScheduleEntryEvent;
  }

  assignTeam(event: any) {

    const currentUser = JSON.parse(<string>localStorage.getItem("user")) as User

    const teamId = currentUser.currentTeamId;

    if (teamId) {
      this.teamService.isUserTeamOwner(teamId, this.userService.getUserId()).subscribe(isOwner => {

         if (isOwner) {
           this.userService.assignTeamToMeetingWithMentor({teamOwnerId: currentUser.id, entryId: 1, teamId: teamId}).subscribe((isAvailable) => {

             event.isAvailable = isAvailable;

           });
         } else {
           console.log("not team owner");
         }
      });
    }
  }
}
