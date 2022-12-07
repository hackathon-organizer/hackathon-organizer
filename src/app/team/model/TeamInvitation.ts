import {Notification} from "../../user/model/Notification";

export interface TeamInvitation extends Notification{

  id: number;
  fromUserName: string;
  toUserKeycloakId: string;
  invitationStatus: string;
  teamName: string;
  teamId: number;
}
