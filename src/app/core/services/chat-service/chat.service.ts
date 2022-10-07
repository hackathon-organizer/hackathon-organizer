import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ChatMessage} from "../../../team/model/ChatMessage";

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient) { }

  getChatRoomMessages(teamChatRoomId: number): Observable<ChatMessage[]> {
     return this.http.get<ChatMessage[]>('http://localhost:9090/api/v1/messages/rooms/' + teamChatRoomId);
  }
}                                                                    
