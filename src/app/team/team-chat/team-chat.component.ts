import { Component, OnInit } from '@angular/core';
import {Client, Versions} from "@stomp/stompjs";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {TeamService} from "../../core/services/team-service/team.service";
import {ChatMessage} from "../model/ChatMessage";
import * as dayjs from "dayjs";
import {ChatService} from "../../core/services/chat-service/chat.service";
import {HttpClient} from "@angular/common/http";

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

  users = '';

  constructor(private http: HttpClient, private route: ActivatedRoute, private teamService: TeamService, private chatService: ChatService) { }

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

  conn!: WebSocket;

  initConn() {
    console.log("init called");


    //this.conn = new WebSocket('ws://localhost:9090/messages-websocket');


    this.client = new Client({
      brokerURL: 'ws://localhost:51678/messages-websocket',
      connectHeaders: {
      },
      debug: (str) => console.log(str)
    });

    this.client.onStompError = function (frame) {
      // Will be invoked in case of error encountered at Broker
      // Bad login/passcode typically will cause an error
      // Complaint brokers will set `message` header with a brief message. Body may contain details.
      // Compliant brokers will terminate the connection after any error
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);
    };

    this.client.activate();


    // this.conn.onopen = () => {
    //   console.log("Connected to the signaling server");
    //   // initialize();
    //   this.conn.send(JSON.stringify({usename: 'pies'}))
    // };
    //
    // this.conn.onmessage = function(msg) {
    //   console.log("Got message", msg.data);
    //   var content = JSON.parse(msg.data);
    //   var data = content.data;
    // }
      // switch (content.event) {
      //   // when somebody wants to call us
      //   case "offer":
      //     this.handleOffer(data);
      //     break;
      //   case "answer":
      //     this.handleAnswer(data);
      //     break;
      //   // when a remote peer sends an ice candidate to us
      //   case "candidate":
      //     this.handleCandidate(data);
      //     break;
      //   default:
      //     break;
      // }
   // };
  }

  sendMessage() {

    const message: ChatMessage = {username: localStorage.getItem("username")!,
        userId: localStorage.getItem("userId")!, entryText: this.message, chatId: 1 }

    this.conn.send(JSON.stringify(message));
  }

  private startChatRoomListening() {

      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
      console.log("CONNECTING...");
      this.client.subscribe('/topic/room/' + this.chatRoomId, (message: any) => {
        // called when the client receives a STOMP message from the server

        console.log(message);

        const msg = JSON.parse(message.body);

        this.updateChat(msg);
      });


    this.client.subscribe('/topic/room/' + this.chatRoomId + '/users', (message: any) => {
      // called when the client receives a STOMP message from the server
      console.log('trggering');

      const msg = message.body;

      console.log('users');
      console.log(msg);
      this.users = msg;
    });

    this.client.subscribe('/topic/room/hujnia', (message: any) => {
      // called when the client receives a STOMP message from the server
      console.log('trggering');

      const msg = message.body;

      console.log('users');
      console.log(msg);
      this.users = msg;
    });

  }

  private updateChat(message: ChatMessage) {

    this.str += message.username + " : " + message.entryText + '\n';
  }



































  // send(message) {
  //   conn.send(JSON.stringify(message));
  // }
  //
  // var peerConnection;
  // var dataChannel;
  // var input = document.getElementById("messageInput");
  //
  // initialize() {
  //   var configuration = null;
  //
  //   peerConnection = new RTCPeerConnection(configuration);
  //
  //   // Setup ice handling
  //   peerConnection.onicecandidate = function(event) {
  //     if (event.candidate) {
  //       send({
  //         event : "candidate",
  //         data : event.candidate
  //       });
  //     }
  //   };
  //
  //   // creating data channel
  //   dataChannel = peerConnection.createDataChannel("dataChannel", {
  //     reliable : true
  //   });
  //
  //   dataChannel.onerror = function(error) {
  //     console.log("Error occured on datachannel:", error);
  //   };
  //
  //   // when we receive a message from the other peer, printing it on the console
  //   dataChannel.onmessage = function(event) {
  //     console.log("message:", event.data);
  //   };
  //
  //   dataChannel.onclose = function() {
  //     console.log("data channel is closed");
  //   };
  //
  //   peerConnection.ondatachannel = function (event) {
  //     dataChannel = event.channel;
  //   };
  //
  // }
  //
  //  createOffer() {
  //   peerConnection.createOffer(function(offer) {
  //     send({
  //       event : "offer",
  //       data : offer
  //     });
  //     peerConnection.setLocalDescription(offer);
  //   }, function(error) {
  //     alert("Error creating an offer");
  //   });
  // }
  //
  //  handleOffer(offer) {
  //   peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  //
  //   // create and send an answer to an offer
  //   peerConnection.createAnswer(function(answer) {
  //     peerConnection.setLocalDescription(answer);
  //     send({
  //       event : "answer",
  //       data : answer
  //     });
  //   }, function(error) {
  //     alert("Error creating an answer");
  //   });
  //
  // };
  //
  //  handleCandidate(candidate) {
  //   peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  // };
  //
  //  handleAnswer(answer) {
  //   peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  //   console.log("connection established successfully!!");
  // };
  //
  //  sendMessage2() {
  //   dataChannel.send(input.value);
  //   input.value = "";
  // }

}
