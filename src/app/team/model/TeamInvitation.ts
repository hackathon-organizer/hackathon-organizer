import {NotificationType} from "../../user/model/NotificationType";

export interface TeamInvitation extends Notification{

  id: number;
  fromUserName: string;
  toUserKeycloakId: string;
  invitationStatus: string;
  teamName: string;
  teamId: number;
  notificationType: NotificationType
}
