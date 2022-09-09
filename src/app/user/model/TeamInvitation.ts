export class TeamInvitation {

  id: string;
  fromUserName: string;
  toUserId: number;
  invitationStatus: string;
  teamName: string;
  teamId: number;

  constructor(id: string, fromUserName: string, toUserId: number, invitationStatus: string, teamName: string, teamId: number) {
    this.id = id;
    this.fromUserName = fromUserName;
    this.toUserId = toUserId;
    this.invitationStatus = invitationStatus;
    this.teamName = teamName;
    this.teamId = teamId;
  }
}
