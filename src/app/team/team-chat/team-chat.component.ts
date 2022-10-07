import { Component, OnInit } from '@angular/core';
import {Client} from "@stomp/stompjs";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {TeamService} from "../../core/services/team-service/team.service";
import {ChatMessage} from "../model/ChatMessage";
import * as dayjs from "dayjs";
import {ChatService} from "../../core/services/chat-service/chat.service";

@Component({
  selector: 'ho-team-chat',
  templateUrl: './team-chat.component.html',
  styleUrls: ['./team-chat.component.scss']
})
export class TeamChatComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();

  message: string = '';
  messages: ChatMessage[] = [];
  client!: Client;

  str = '';

  chatRoomId: number = 0;

  chatRoomTitle: string = "";

  constructor(private route: ActivatedRoute, private teamService: TeamService, private chatService: ChatService) { }

  ngOnInit(): void {

    this.routeSubscription = this.route.params.subscribe(params => {
      this.teamService.getTeamById(params['teamId']).subscribe(team => {

             this.chatService.getChatRoomMessages(team.teamChatRoomId).subscribe(messages => {
               this.messages = messages;

               messages.forEach(msg => this.updateChat(msg));
             });

             this.chatRoomTitle = team.name;

             this.chatRoomId = team.teamChatRoomId;

        this.initConn();
      })
    });
  }

  initConn() {
    console.log("init called");

    this.client = new Client({
      brokerURL: 'ws://localhost:9090/messages-websocket',
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {

    this.startChatRoomListening();

    };

    this.client.onStompError = function (frame) {
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  sendMessage() {

    const message: ChatMessage = {username: localStorage.getItem("username")!,
        userId: localStorage.getItem("userId")!, entryText: this.message }

    this.client.publish({ destination: '/ws/room/' + this.chatRoomId, body: JSON.stringify(message) });
  }

  private startChatRoomListening() {

      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
      console.log("CONNECTING...");
      this.client.subscribe('/topic/room/' + this.chatRoomId, (message: any) => {
        // called when the client receives a STOMP message from the server

        const msg = JSON.parse(message.body);

        this.updateChat(msg);
      });

  }

  private updateChat(message: ChatMessage) {

    this.str += message.username + " : " + message.entryText + '\n';
  }


}
