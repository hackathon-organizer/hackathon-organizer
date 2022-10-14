import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Client, Versions} from "@stomp/stompjs";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {TeamService} from "../../core/services/team-service/team.service";
import {ChatMessage} from "../model/ChatMessage";
import * as dayjs from "dayjs";
import {ChatService} from "../../core/services/chat-service/chat.service";
import {HttpClient} from "@angular/common/http";
import {MessageType} from "../model/MessageType";

@Component({
  selector: 'ho-team-chat',
  templateUrl: './team-chat.component.html',
  styleUrls: ['./team-chat.component.scss']
})
export class TeamChatComponent implements AfterViewInit {

  mediaConstraints = {
    audio: false,
    video: {
      frameRate: { ideal: 30, max: 60 },
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      disableSimulcast: true,
      enableLayerSuspension: false,
      preferH264: true,
      disableH264: false,
      disableRtx: true,
      enableTcc: true,
      desktopSharingFrameRate: {
        min: 25,
        max: 25
      },
    }
  };

  private routeSubscription: Subscription = new Subscription();

  message: string = '';
  messages: ChatMessage[] = [];

  str = '';

  chatRoomId: number = 0;
  chatRoomTitle: string = "";

  users = '';
  @ViewChild('local_video') localVideo!: ElementRef;
  @ViewChild('remote_video') remoteVideo!: ElementRef;

  // constructor(private http: HttpClient, private route: ActivatedRoute, private teamService: TeamService, private chatService: ChatService) { }
  //
  // ngOnInit(): void {
  //   this.initConn();
  //
  //   // this.routeSubscription = this.route.params.subscribe(params => {
  //   //   this.teamService.getTeamById(params['teamId']).subscribe(team => {
  //   //
  //   //          this.chatService.getChatRoomMessages(team.teamChatRoomId).subscribe(messages => {
  //   //            this.messages = messages;
  //   //
  //   //            messages.forEach(msg => this.updateChat(msg));
  //   //          });
  //   //
  //   //          this.chatRoomTitle = team.name;
  //   //
  //   //          this.chatRoomId = team.teamChatRoomId;
  //   //
  //   //
  //   //   })
  //   // });
  // }


  private peerConnection!: RTCPeerConnection;

  private localStream!: MediaStream;

  inCall = false;
  localVideoActive = false;

  senders: RTCRtpSender[] = [];

  constructor(private chatService: ChatService) { }

  ngAfterViewInit(): void {
    this.addIncomingMessageHandler();
    this.requestMediaDevices();
  }

  async call(): Promise<void> {
    this.createPeerConnection();

    this.localStream.getTracks().forEach(
      track => this.senders.push(this.peerConnection.addTrack(track, this.localStream))
    );

    try {
      const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer();

      await this.peerConnection.setLocalDescription(offer);

      this.inCall = true;

      this.chatService.sendMessage({type: MessageType.OFFER, data: offer});
    } catch (err: any) {
      this.handleError(err);
    }
  }

  hangUp(): void {
    this.chatService.sendMessage({type: MessageType.HANGUP, data: ''});
    this.closeVideoCall();
  }

  private addIncomingMessageHandler(): void {
    this.chatService.connect();

    this.chatService.messages$.subscribe(
      msg => {
        switch (msg.type) {
          case MessageType.OFFER:
            this.handleOfferMessage(msg.data);
            break;
          case MessageType.ANSWER:
            this.handleAnswerMessage(msg.data);
            break;
          case MessageType.HANGUP:
            this.handleHangupMessage();
            break;
          case MessageType.ICE_CANDIDATE:
            this.handleICECandidateMessage(msg.data);
            break;
        }
      },
      this.handleError
    );
  }

  /* ########################  MESSAGE HANDLERS  ################################## */

  private handleOfferMessage(msg: RTCSessionDescriptionInit): void {
    console.log('handle incoming offer');
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    if (!this.localStream) {
      this.startLocalVideo();
    }

    this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg))
      .then(() => {

        this.localVideo.nativeElement.srcObject = this.localStream;
        this.localStream.getTracks().forEach(
          track => this.peerConnection.addTrack(track, this.localStream)
        );

      }).then(() => {

      return this.peerConnection.createAnswer();
    }).then((answer) => {

      return this.peerConnection.setLocalDescription(answer);
    }).then(() => {

      this.chatService.sendMessage({type: MessageType.OFFER, data: this.peerConnection.localDescription});
      this.inCall = true;
    }).catch(this.handleError);
  }

  private handleAnswerMessage(msg: RTCSessionDescriptionInit): void {
    this.peerConnection.setRemoteDescription(msg);
  }

  private handleHangupMessage(): void {
    this.closeVideoCall();
  }

  private handleICECandidateMessage(msg: RTCIceCandidate): void {
    const candidate = new RTCIceCandidate(msg);
    this.peerConnection.addIceCandidate(candidate).catch(this.handleError);
  }

  private async requestMediaDevices(): Promise<void> {

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
      this.pauseLocalVideo();
    } catch (err: any) {
      this.handleError(err);
    }
  }

  startLocalVideo(): void {
    this.localStream.getTracks().forEach(track => {
      track.enabled = true;
    });

    this.localVideo.nativeElement.srcObject = this.localStream;

    this.localVideoActive = true;
  }

  pauseLocalVideo(): void {
    this.localStream.getTracks().forEach(track => {
      track.enabled = false;
    });
    this.localVideo.nativeElement.srcObject = undefined;

    this.localVideoActive = false;
  }

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection();

    this.peerConnection.onicecandidate = this.handleICECandidateEvent;
    this.peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.peerConnection.ontrack = this.handleTrackEvent;
  }

  private closeVideoCall(): void {

    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onsignalingstatechange = null;

      this.peerConnection.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });

      this.peerConnection.close();
      this.inCall = false;
    }
  }

  /* ########################  ERROR HANDLER  ################################## */
  private handleError(err: Error): void {

    console.log(err);

    this.closeVideoCall();
  }

  /* ########################  EVENT HANDLER  ################################## */
  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {

    if (event.candidate) {
      this.chatService.sendMessage({
        type: MessageType.ICE_CANDIDATE,
        data: event.candidate
      });
    }
  }

  private handleSignalingStateChangeEvent = (event: Event) => {

    switch (this.peerConnection.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }

  async startScreenShare() {

    const displayMediaStream = await navigator.mediaDevices.getDisplayMedia(this.mediaConstraints);

    // @ts-ignore
    await this.senders.find((sender: RTCRtpSender) => sender.track.kind === 'video').replaceTrack(displayMediaStream.getTracks()[0]);
    this.localVideo.nativeElement.srcObject = displayMediaStream;

    // TODO implement stop sharing
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }
  // sendMessage() {
  //
  //   const message: ChatMessage = {username: localStorage.getItem("username")!,
  //       userId: localStorage.getItem("userId")!, entryText: this.message, chatId: 1 }
  //
  //   this.conn.send(JSON.stringify(message));
  // }
  // private updateChat(message: ChatMessage) {
  //
  //   this.str += message.username + " : " + message.entryText + '\n';
  // }



































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
