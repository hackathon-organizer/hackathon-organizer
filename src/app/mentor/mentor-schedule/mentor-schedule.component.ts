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

const colors: Record<string, EventColor> = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF',
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA',
  },
};

@Component({
  selector: 'ho-mentor-schedule',
  templateUrl: './mentor-schedule.component.html',
  styleUrls: ['./mentor-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentorScheduleComponent {

  constructor(private userService: UserService, private route: ActivatedRoute, private logger: NGXLogger) {

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

  view: CalendarView = CalendarView.Week;

  CalendarView = CalendarView;

  viewDate: Date = new Date();

  actions: CalendarEventAction[] = [
    {
      label: '<i class=""></i>',
      a11yLabel: 'Edit',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
      },
    },
    {
      label: '<i class=""></i>',
      a11yLabel: 'Delete',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter((iEvent) => iEvent !== event);
        this.handleEvent('Deleted', event);
      },
    },
  ];

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
    this.handleEvent('Dropped or resized', event);
  }

  handleEvent(action: string, event: CalendarEvent): void {
    // this.modalData = { event, action };
   // this.modal.open(this.modalContent, { size: 'lg' });
  }

  addEvent(): void {
    this.events = [
      ...this.events,
      {
        title: 'New event',
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
        color: colors.red,
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true,
        },
      },
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

  private mapToCalendarEvent(x: MentorScheduleEntry): CalendarEvent {
    return {
      start: new Date(x.sessionStart),
      end: new Date(x.sessionEnd),
      color: x.entryColor ? x.entryColor : colors.red,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: false,
      },
    } as CalendarEvent;
  }
}
