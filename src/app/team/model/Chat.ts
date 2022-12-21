import {MessageType} from "./MessageType";

export interface BasicMessage {
  messageType: MessageType;
  data: any;
}

export interface ChatMessage {
  entryText: string;
  username: string;
  userId: string | number;
  teamId: number;
  createdAt?: Date;
}
