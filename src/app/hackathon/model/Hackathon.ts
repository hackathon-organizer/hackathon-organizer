export interface HackathonResponse {
  id: number;
  name: string;
  description: string;
  organizerInfo?: string;
  isActive: boolean;
  hackathonParticipantsNumber: number;
  logoName: string;
  eventStartDate: Date | string;
  eventEndDate: Date | string;
}

export interface HackathonResponsePage {
  content: HackathonResponse[];
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface HackathonRequest {
  name: string;
  description: string;
  organizerInfo: string;
  ownerId: number;
  eventStartDate: Date | string;
  eventEndDate: Date | string;
}
