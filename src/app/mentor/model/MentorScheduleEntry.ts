export interface MentorScheduleEntry {

  userId: number;
  hackathonId: number;
  sessionStart: Date;
  sessionEnd: Date;
  info?: string;
  entryColor?: string;
  teamId?: number;
}
