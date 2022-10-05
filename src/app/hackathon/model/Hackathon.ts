export interface HackathonDto {
  id: number;
  name: string;
  description: string;
  hackathonParticipantsNumber: number;
  eventStartDate: Date | string;
  eventEndDate: Date | string;
}
