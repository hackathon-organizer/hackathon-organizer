import {CalendarEvent} from "angular-calendar";

export interface ScheduleEntryEvent extends CalendarEvent {
  id: number;
  userId: number;
  hackathonId: number;
  sessionStart: Date;
  sessionEnd: Date;
  isAvailable: boolean;
  info?: string;
  entryColor?: string;
  teamId?: number;
}
