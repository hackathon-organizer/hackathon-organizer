import {NotificationType} from "../../user/model/NotificationType";

export interface MeetingNotification extends Notification {

  chatId: number;
  teamId: number;
  notificationType: NotificationType
}
