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
import {NGXLogger} from "ngx-logger";
import {log} from "util";

@Component({
  selector: 'ho-team-chat',
  templateUrl: './team-chat.component.html',
  styleUrls: []
})
export class TeamChatComponent implements AfterViewInit {

  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  @ViewChild('remoteAudio') remoteAudio!: ElementRef;


  mediaConstraints = {
    audio: true,
    video: {
      frameRate: {ideal: 30, max: 60},
      width: {ideal: 1280, max: 1920},
      height: {ideal: 720, max: 1080},
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

  chatMessages = '';

  chatRoomId: number = 0;
  chatRoomTitle: string = "";
  users: any[] = [];

  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;

  storedVideo!: any;

  inCall = false;
  localVideoActive = false;
  microphoneActive = true;
  cameraActive = false;
  screenShareActive = false;

  senders: RTCRtpSender[] = [];


  constructor(private chatService: ChatService, private logger: NGXLogger,
              private http: HttpClient, private route: ActivatedRoute,
              private teamService: TeamService) {
  }

  ngAfterViewInit(): void {

    this.routeSubscription = this.route.params.subscribe(params => {
      this.teamService.getTeamById(params['teamId']).subscribe(team => {

        this.chatRoomId = team.teamChatRoomId;
        this.chatRoomTitle = team.name;

        this.chatService.getChatRoomMessages(1).subscribe(messages => {
          this.messages = messages;

          messages.forEach(msg => this.updateChat(msg));
        });
      })
    });

    this.addIncomingMessageHandler();
    this.requestMediaDevices();
  }

  async call(): Promise<void> {
    this.inCall = true;

    this.createPeerConnection();


    this.localStream.getTracks().forEach(
      track => {
          track.enabled = false;
          this.senders.push(this.peerConnection.addTrack(track, this.localStream))
      }
    );

    this.startLocalAudio();

    try {

      const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer();

      await this.peerConnection.setLocalDescription(offer);

      //this.inCall = true;

      // if (this.storedVideo) {
      //   console.log(this.storedVideo)
      //   this.remoteVideo.nativeElement.srcObject = this.storedVideo;
      // } else {
       // this.startLocalAudio();
     // }



      this.chatService.sendMessage({messageType: MessageType.OFFER, data: offer});

      this.microphoneActive = true;
    } catch (err: any) {
      this.handleError(err);
    }
  }

  hangUp(): void {
    this.pauseLocalVideo();
    this.localVideoActive = false;
    this.screenShareActive = false;

    this.chatService.sendMessage({messageType: MessageType.HANGUP, data: ''});
    this.closeVideoCall();
  }

  private addIncomingMessageHandler(): void {
    this.chatService.connect(1);

    this.chatService.messages$.subscribe(msg => {

        switch (msg.messageType) {
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
          case MessageType.MESSAGE:
            this.updateChat(msg.data);
            break;
          case MessageType.JOIN:
            this.updateChatParticipants(msg.data);
            break;
        }
      },
      this.handleError
    );
  }

  /* ########################  MESSAGE HANDLERS  ################################## */

  private handleOfferMessage(msg: RTCSessionDescriptionInit): void {
    //this.logger.info("Handling incoming offer");
    if (!this.peerConnection) {

      //this.logger.info("Peer connection not exist. Creating one now...");

      this.createPeerConnection();
    }

    if (!this.localStream) {

      //this.logger.info("Local video not exist. Starting one now...");

      this.startLocalAudio();
    }


    this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg))
      .then(() => {

        //this.logger.info("Adding media stream to local video");

        // if video...
        // this.localStream.getVideoTracks().forEach(t => {
        //   this.localVideo.nativeElement.srcObject = t;
        // })


        //this.logger.info("Adding media tracks to remote connection");

        this.localStream.getTracks().forEach(
          track => {
             // this.peerConnection.addTrack(track, this.localStream)
            console.log(track)

            track.enabled = false;
          }
        );

      }).then(() => {

      //this.logger.info("Building SDP for answer message");

      return this.peerConnection.createAnswer();
    }).then((answer) => {

      //this.logger.info("Setting local SDP");

      return this.peerConnection.setLocalDescription(answer);
    }).then(() => {

      // this.logger.info("Sending local SDP to remote party");

      this.chatService.sendMessage({messageType: MessageType.ANSWER, data: this.peerConnection.localDescription});
      // this.inCall = true;
    }).catch(this.handleError);
  }

  private handleAnswerMessage(msg: RTCSessionDescriptionInit): void {

    //this.logger.info("Handling answer message", msg);

    this.peerConnection.setRemoteDescription(msg);
  }

  private handleHangupMessage(): void {

    this.logger.info("Handling hang up message");

    this.closeVideoCall();
  }

  private handleICECandidateMessage(msg: RTCIceCandidate): void {

    this.logger.info("Handling ice candidate", msg);

    const candidate = new RTCIceCandidate(msg);
    this.peerConnection.addIceCandidate(candidate).catch(this.handleError);
  }

  private async requestMediaDevices(): Promise<void> {

    this.logger.info("Requesting users media devices");

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
      // this.pauseLocalVideo();
    } catch (err: any) {
      this.handleError(err);
    }
  }

  startLocalAudio(): void {

    // this.logger.info("Starting local video");

    this.localStream.getAudioTracks().find(track => {
        track.enabled = true;
    });

    console.log();
  }

  startVideo() {
    this.localStream.getTracks().forEach(track => {
      track.enabled = true;
    });

    this.localVideo.nativeElement.srcObject = this.localStream;

    // this.localVideoActive = true;

    // @ts-ignore
    // this.senders.find(sender => sender.track.kind === 'video').track.enabled = true;


    this.localVideoActive = !this.localVideoActive;
  }

  pauseLocalVideo(): void {

    //this.logger.info("Pausing local video");

    this.localStream.getTracks().forEach(track => {
      track.enabled = false;
    });
    this.localVideo.nativeElement.srcObject = undefined;

    this.localVideoActive = false;
  }

  private createPeerConnection(): void {

    //this.logger.info("Creating new peer connection");

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

    // this.logger.error("Handling error ", err);

    this.closeVideoCall();
  }

  /* ########################  EVENT HANDLER  ################################## */
  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {

    //this.logger.info("Handling new ice candidate", event.candidate);

    if (event.candidate) {
      this.chatService.sendMessage({
        messageType: MessageType.ICE_CANDIDATE,
        data: event.candidate
      });
    }
  }

  private handleSignalingStateChangeEvent = () => {

    //this.logger.info("Signaling state changed");

    switch (this.peerConnection.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }

  async startScreenShare() {

    //this.logger.info("Starting sharing screen...");

    const displayMediaStream = await navigator.mediaDevices.getDisplayMedia(this.mediaConstraints);

    console.log(this.senders)


    if (this.senders.length > 0) {

      // @ts-ignore
      await this.senders.find((sender: RTCRtpSender) => sender.track.kind === 'video').replaceTrack(displayMediaStream.getTracks()[0]);
    }

    this.localVideo.nativeElement.srcObject = displayMediaStream;

    this.screenShareActive = true;

    // TODO implement stop sharing
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {

    this.logger.info("Handling remote track event");

    //console.log(event.streams)

    console.log(event.streams)

    // event.streams[0].getAudioTracks().forEach(t => {
    //   this.remoteAudio.nativeElement.srcObject = t;
    // });

    // this.remoteAudio.nativeElement.srcObject = event.streams[0];
    //this.remoteVideo.nativeElement.srcObject = event.streams[0];


    event.streams.forEach(stream => {
      console.log(stream)
      stream.getTracks().forEach(track => {
        console.log(track)
        if (track.kind === 'audio' && track.enabled) {
          console.log('audio')
          this.remoteAudio.nativeElement.srcObject = event.streams[0];
        } else if (track.kind === 'video' && track.enabled) {
          this.remoteAudio.nativeElement.srcObject = null;
          this.remoteVideo.nativeElement.srcObject = event.streams[0];
        }


      })
    })

    //this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }

  private updateChatParticipants(users: any[]) {
    this.users = users;
  }

  private updateChat(message: ChatMessage) {

    this.chatMessages += message.username + ": " + message.entryText + '\n';
  }

  sendTextMessage() {
    const chatMessage: ChatMessage = {
      username: localStorage.getItem("username")!,
      userId: localStorage.getItem("userId")!, entryText: this.message, chatId: 1
    }

    this.updateChat(chatMessage);

    const basicMessage = {messageType: MessageType.MESSAGE, data: chatMessage};

    this.chatService.sendMessage(basicMessage);
  }

  muteMicrophone() {
    this.microphoneActive = !this.microphoneActive;
    this.localStream.getAudioTracks().forEach(track => track.enabled = true);

  }

  toggleFullscreen() {
    const remoteVideo = this.remoteVideo.nativeElement;

    if (remoteVideo.requestFullscreen) {
      remoteVideo.requestFullscreen();
    } else if (remoteVideo.mozRequestFullScreen) {
      remoteVideo.mozRequestFullScreen();
    } else if (remoteVideo.webkitRequestFullscreen) {
      remoteVideo.webkitRequestFullscreen();
    } else if (remoteVideo.msRequestFullscreen) {
      remoteVideo.msRequestFullscreen();
    }
  }
}
