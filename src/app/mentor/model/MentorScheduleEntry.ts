export interface MentorScheduleEntry {

  userId: number;
  hackathonId: number;
  sessionStart: Date;
  sessionEnd: Date;
  isAvailable?: boolean;
  info?: string;
  entryColor?: string;
  teamId?: number;
}
