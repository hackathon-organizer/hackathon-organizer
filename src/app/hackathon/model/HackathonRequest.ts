export interface HackathonRequest {
  name: string;
  description: string;
  organizerInfo: string;
  ownerId: number;
  eventStartDate: Date | string;
  eventEndDate: Date | string;
}
