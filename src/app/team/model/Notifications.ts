import {NotificationType} from "../../user/model/NotificationType";

export interface Notification {
  message: string;
  notificationType: NotificationType
}

export interface MeetingNotification extends Notification {
  chatId: number;
}

export interface TeamInvitationNotification extends Notification {
  id: number;
  fromUserName: string;
  toUserKeycloakId: string;
  invitationStatus: string;
  teamName: string;
  teamId: number;
}
