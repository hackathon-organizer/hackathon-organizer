export class InvitationDto {
  id: number;
  fromUserName: string;
  invitationStatus: string;
  teamName: string;
  teamId: number;


  constructor(id: number, fromUserName: string, invitationStatus: string, teamName: string, teamId: number) {
    this.id = id;
    this.fromUserName = fromUserName;
    this.invitationStatus = invitationStatus;
    this.teamName = teamName;
    this.teamId = teamId;
  }
}
