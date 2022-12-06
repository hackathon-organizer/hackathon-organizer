import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, Subject} from "rxjs";
import {ChatMessage} from "../../../team/model/ChatMessage";
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {BasicMessage} from "../../../team/model/BasicMessage";
import {NGXLogger} from "ngx-logger";

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient, private logger: NGXLogger) { }

  private socket$!: WebSocketSubject<any>;

  private messagesSubject = new Subject<BasicMessage>();
  public messages$ = this.messagesSubject.asObservable();

  public connect(chatId: number): void {

    //this.logger.info("Starting web socket connection...");

    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket(chatId);

      //this.logger.info("Subscribing to websocket messages...");

      this.socket$.subscribe(
        (msg: BasicMessage) => {
         // this.logger.info("Message of type received", msg.messageType);
          this.messagesSubject.next(msg);
        }
      );
    } else {
      this.logger.info("Connection already exists");
    }
  }


  sendMessage(msg: BasicMessage): void {
    //this.logger.info("Sending message of type ", msg.messageType);
    this.socket$.next(msg);
  }

  private getNewWebSocket(chatId: number): WebSocketSubject<any> {

    this.logger.info("Creating new websocket connection");

    return webSocket({
      url: 'ws://localhost:9090/messages-websocket?username=' + localStorage.getItem('username') + '&chatId=' + chatId,
      openObserver: {
        next: () => {
          this.logger.info("Websocket connection established successfully");
        }
      },
      closeObserver: {
        next: () => {
          this.logger.info("Websocket connection closed. Restarting...");
          this.connect(chatId);
        }
      }
    });
  }

  getChatRoomMessages(teamChatRoomId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>('http://localhost:9090/api/v1/messages/rooms/' + teamChatRoomId);
  }
}
