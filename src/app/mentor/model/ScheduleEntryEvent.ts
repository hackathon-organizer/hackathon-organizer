import {CalendarEvent} from "angular-calendar";

export interface ScheduleEntryEvent extends CalendarEvent {
  hackathonId?: number;
  isAvailable?: boolean;
  info?: string;
  teamId?: number;
}

export interface ScheduleEntryResponse {
  id: number;
  username?: string;
  userId: number;
  sessionStart: Date;
  sessionEnd: Date;
  entryColor?: string;
  isAvailable: boolean;
  info?: string;
}

export interface ScheduleEntryRequest {
  id?: number;
  sessionStart: Date;
  sessionEnd: Date;
  hackathonId: number;
  entryColor?: string;
  info?: string;
}

export interface TeamMeetingRequest {
  teamOwnerId: number;
  teamId: number;
}

export interface ScheduleEntrySession {
  sessionStart: Date,
  sessionEnd: Date
}

