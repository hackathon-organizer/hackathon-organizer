export interface HackathonDto {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  hackathonParticipantsNumber: number;
  eventStartDate: Date | string;
  eventEndDate: Date | string;
}

export interface HackathonResponse {
  content: HackathonDto[];
  number: number;
  totalElements: number;
  totalPages: number;
}
