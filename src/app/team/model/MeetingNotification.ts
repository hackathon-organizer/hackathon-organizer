import {NotificationType} from "../../user/model/NotificationType";
import {Notification} from "../../user/model/Notification";


export interface MeetingNotification extends Notification {

  chatId: number;
  teamId: number;
}
