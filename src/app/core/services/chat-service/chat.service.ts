import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, Subject} from "rxjs";
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {NGXLogger} from "ngx-logger";
import {UserManager} from "../../../shared/UserManager";
import {BasicMessage, ChatMessage} from "../../../team/model/Chat";
import {environment} from "../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private socket!: WebSocketSubject<any>;
  private messagesSubject = new Subject<BasicMessage>();
  public messages = this.messagesSubject.asObservable();
  private API_URL = environment.API_URL;

  constructor(private http: HttpClient, private logger: NGXLogger) {
  }

  public connect(chatId: number): void {

    this.logger.info("Starting web socket connection to chat with id: ", chatId);

    if (!this.socket || this.socket.closed) {
      this.socket = this.getNewWebSocket(chatId);

      this.socket.subscribe(
        (msg: BasicMessage) => {
          this.logger.info("Message of type received: ", msg.messageType);
          this.messagesSubject.next(msg);
        }
      );
    }
  }

  sendMessage(msg: BasicMessage): void {
    this.logger.info("Sending message of type: ", msg.messageType);
    this.socket.next(msg);
  }

  getChatRoomMessages(teamChatRoomId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(this.API_URL + '/api/v1/messages/rooms/' + teamChatRoomId);
  }

  private getNewWebSocket(chatId: number): WebSocketSubject<any> {

    this.logger.info("Creating new websocket connection");
    const username = UserManager.currentUserFromStorage.username;

    const WS_API_URL = this.API_URL.replace(
      new RegExp("(https|http)"), environment.production ? "wss" : "ws");

    return webSocket({
      url: WS_API_URL + '/messages-websocket?username=' + username + '&chatId=' + chatId,
      openObserver: {
        next: () => {
          this.logger.info("Websocket connection established successfully");
        }
      },
      closeObserver: {
        next: () => {
          this.logger.info("Websocket connection closed. Restarting...");

          setTimeout(() => {
            this.getNewWebSocket(chatId);
          }, 5000);
        }
      }
    });
  }
}
