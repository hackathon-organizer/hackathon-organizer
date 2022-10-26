import {CalendarEvent} from "angular-calendar";

export interface ScheduleEntryEvent extends CalendarEvent {

  isAvailable: boolean;
}
