export class TeamInvitation {

  id: number;
  fromUserName: string;
  toUserKeycloakId: string;
  invitationStatus: string;
  teamName: string;
  teamId: number;

  constructor(id: number, fromUserName: string, toUserKeycloakId: string, invitationStatus: string, teamName: string, teamId: number) {
    this.id = id;
    this.fromUserName = fromUserName;
    this.toUserKeycloakId = toUserKeycloakId;
    this.invitationStatus = invitationStatus;
    this.teamName = teamName;
    this.teamId = teamId;
  }
}
