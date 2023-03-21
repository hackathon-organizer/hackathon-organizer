import {CalendarEvent} from "angular-calendar";

export interface ScheduleEntry extends CalendarEvent {
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
  teamId?: number;
  entryColor?: string;
  isAvailable: boolean;
  info?: string;
}

export interface ScheduleEntryRequest {
  id?: number;
  sessionStart: Date | string;
  sessionEnd: Date | string;
  hackathonId: number;
  entryColor?: string;
  info?: string;
}

export interface TeamMeetingRequest {
  teamOwnerId: number;
  teamId: number;
}

export interface ScheduleEntrySession {
  hackathonId: number;
  sessionStart: Date | string;
  sessionEnd: Date | string
}

