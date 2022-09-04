export class TeamInvitation {
  fromUserId: number;
  toUserId: number;
  invitationStatus: string;
  teamName: string;


  constructor(fromUserId: number, toUserId: number, invitationStatus: string, teamName: string) {
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.invitationStatus = "PENDING";
    this.teamName = "TEST TEAM";
  }
}
