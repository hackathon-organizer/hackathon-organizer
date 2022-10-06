import { Component, OnInit } from '@angular/core';
import {Client} from "@stomp/stompjs";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {TeamService} from "../../core/services/team-service/team.service";

@Component({
  selector: 'ho-team-chat',
  templateUrl: './team-chat.component.html',
  styleUrls: ['./team-chat.component.scss']
})
export class TeamChatComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();

  message: string = '';
  client!: Client;
  chatRoomId: any;

  chatRoomTitle: string = "";

  constructor(private route: ActivatedRoute, private teamService: TeamService) { }

  ngOnInit(): void {

    this.routeSubscription = this.route.params.subscribe(params => {
      this.teamService.getTeamById(params['teamId']).subscribe(team => {

             this.chatRoomTitle = team.name;

             this.chatRoomId = team.teamChatRoomId;

        this.initConn(this.chatRoomId);
      })
    });
  }

  sendMessage() {
     this.message += 'test';
  }

  initConn(chatRoomId: number) {
    this.client = new Client({
      brokerURL: 'ws://localhost:9090/messages-websocket',
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    setInterval(() => {
      console.log("sengin msg");
      this.client.publish({ destination: '/ws/room/' + chatRoomId, body: 'Hello world' });
    }, 5000)

    this.client.onConnect = (frame) => {
      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
      console.log("CONNECTING...");
      this.client.subscribe('/topic/room/' + chatRoomId, (message: any) => {
        // called when the client receives a STOMP message from the server

        const invite = message.body;
        const invite2 = message;
        console.log("recived")
        console.log(invite);
        console.log(invite2);
        console.log('')

      });
    };

    this.client.onStompError = function (frame) {
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);
    };

    this.client.activate();
  }


}
