import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {TeamService} from "../../core/services/team-service/team.service";
import {ChatService} from "../../core/services/chat-service/chat.service";
import {HttpClient} from "@angular/common/http";
import {MessageType} from "../model/MessageType";
import {NGXLogger} from "ngx-logger";
import {OpenVidu, Publisher, Session, StreamEvent, StreamManager, Subscriber, VideoInsertMode} from 'openvidu-browser';
import {UserManager} from "../../shared/UserManager";
import {BasicMessage, ChatMessage} from "../model/Chat";

@Component({
  selector: 'ho-team-chat',
  templateUrl: './team-chat.component.html',
  styleUrls: []
})
export class TeamChatComponent implements AfterViewInit, OnDestroy {

  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  @ViewChild('subscribersAudio') subscribersAudio!: ElementRef;
  @ViewChild('videos') videosContainer!: ElementRef;
  chatEntry: string = "";
  chatMessages: string = "";
  chatRoomId?: number;
  users: any[] = [];
  OV!: OpenVidu;
  session!: Session;
  publisher!: StreamManager;
  subscribers: StreamManager[] = [];
  mainStreamManager!: StreamManager;
  sessionToken?: string;
  sessionId?: string;
  locked = true;
  audioActive = true;
  videoActive = false;
  screenActive = false;
  inCall = false;
  private routeSubscription: Subscription = new Subscription();

  constructor(private chatService: ChatService,
    private logger: NGXLogger,
    private http: HttpClient,
    private route: ActivatedRoute,
    private teamService: TeamService) {
  }

  ngAfterViewInit(): void {

    this.routeSubscription = this.route.params.subscribe(params => {
      this.teamService.getTeamById(params['teamId']).subscribe(team => {

        this.chatRoomId = team.teamChatRoomId;

        this.chatService.connect(this.chatRoomId);
        this.chatService.messages$.subscribe(message => this.messageHandler(message));

        this.chatService.getChatRoomMessages(this.chatRoomId).subscribe(messages => {

          messages.forEach(message => this.updateChat(message));
        });
      })
    });
  }

  joinSession() {

    this.inCall = true;

    this.OV = new OpenVidu();

    this.session = this.OV.initSession();

    this.session.on('streamCreated', (event: StreamEvent) => {

      let subscriber: Subscriber = this.session.subscribe(event.stream, undefined);

      this.subscribers.push(subscriber);

      if (subscriber.stream.hasAudio) {
        subscriber.createVideoElement(this.subscribersAudio.nativeElement, VideoInsertMode.APPEND);
      }

      if (subscriber.stream.hasVideo) {
        subscriber.removeAllVideos();
        subscriber.addVideoElement(this.remoteVideo.nativeElement);
      }
    });

    this.session.on('streamDestroyed', (event: StreamEvent) => {
      this.deleteSubscriber(event.stream.streamManager);
    });

    this.session.on('exception', (exception) => {
      this.logger.warn("Session exception occurred: ", exception);
      throw new Error("Session exception occurred. Please try again later.")
    });

    const token = this.getToken();

    this.session.connect(token)
      .then(() => {

        let publisher: Publisher = this.OV.initPublisher(undefined, {
          audioSource: undefined,
          videoSource: false,
          publishAudio: true,
          publishVideo: false,
        });

        this.session.publish(publisher);

        this.mainStreamManager = publisher;
        this.publisher = publisher;

        this.mainStreamManager.addVideoElement(this.localVideo.nativeElement);
      })
      .catch(error => {
        this.logger.info('There was an error connecting to the session:', error.code, error.message);
      });
  }

  toggleAudiSharing() {
    this.audioActive = !this.audioActive;

    this.updatePublisher();
  }

  toggleVideoSharing() {
    this.videoActive = !this.videoActive;

    if (this.videoActive) {
      this.chatService.sendMessage({
        messageType: MessageType.VIDEO_IN_PROGRESS,
        data: {
          sharing: true
        }
      });
    } else {
      this.chatService.sendMessage({
        messageType: MessageType.VIDEO_IN_PROGRESS,
        data: {
          sharing: false
        }
      });
    }

    this.updatePublisher();
  }

  startSharingScreen() {
    if (this.publisher instanceof Publisher) {
      this.session.unpublish(this.publisher);
    }

    let newPublisher: Publisher = this.OV.initPublisher(undefined, {
      audioSource: undefined,
      videoSource: "screen",
      publishAudio: true,
      publishVideo: true,
      resolution: '1920x1080',
      frameRate: 30,
      insertMode: 'APPEND',
      mirror: false
    });

    this.session.publish(newPublisher);

    this.mainStreamManager = newPublisher;
    this.publisher = newPublisher;

    if (this.publisher instanceof Publisher) {
      this.publisher.once('accessAllowed', (event) => {
        this.publisher.stream.getMediaStream().getVideoTracks()[0].addEventListener('ended', () => {
          this.logger.info("User pressed the \"Stop sharing\" button");
        });
        if (this.publisher instanceof Publisher) {
          this.session.publish(this.publisher);
        }
      });

      this.publisher.once('accessDenied', (event) => {
        this.logger.info("ScreenShare: Access Denied");
        throw new Error("ScreenShare: Access Denied");
      });
    }

    this.mainStreamManager.addVideoElement(this.remoteVideo.nativeElement);
  }

  getToken(): string {

    if (this.sessionToken) {
      return this.sessionToken;
    } else {
      this.logger.info("No token found for session: ", this.session);
      throw new Error("No token found. Please refresh page.");
    }
  }

  getSessionId(): string {

    if (this.sessionId) {
      return this.sessionId;
    } else {
      this.logger.info("No session found");
      throw new Error("No session found. Please refresh page.")
    }
  }

  leaveSession() {

    if (this.publisher instanceof Publisher) {
      this.session.unpublish(this.publisher);
    }

    this.chatService.sendMessage({
      messageType: MessageType.VIDEO_IN_PROGRESS,
      data: {
        sharing: false
      }
    });

    this.inCall = false;
  }

  sendTextMessage() {

    if (this.chatRoomId) {
      const chatMessage: ChatMessage = {
        username: UserManager.currentUserFromStorage.username,
        userId: UserManager.currentUserFromStorage.id,
        entryText: this.chatEntry,
        teamId: this.chatRoomId
      };

      const message = {messageType: MessageType.MESSAGE, data: chatMessage};

      this.chatService.sendMessage(message);
    } else {
      this.logger.info("Chat room id can't be null.");
      throw new Error("Chat room id can't be null. Try to refresh page");
    }

    this.chatEntry = "";
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

  ngOnDestroy(): void {

    this.leaveSession();
    this.routeSubscription.unsubscribe();
  }

  private messageHandler(message: BasicMessage) {

    switch (message.messageType) {
      case MessageType.SESSION: {

        this.sessionId = message.data.videoSessionId;
        this.sessionToken = message.data.videoSessionToken;

        this.locked = false;
        break;
      }
      case MessageType.JOIN: {
        this.updateChatParticipants(message.data);
        break;
      }
      case MessageType.MESSAGE: {
        this.updateChat(message.data);
        break;
      }
      case MessageType.VIDEO_IN_PROGRESS: {

        if (!this.videoActive && !this.screenActive) {
          this.locked = message.data.sharing;
        }
        break;
      }
    }
  }

  private updatePublisher() {
    if (this.publisher instanceof Publisher) {
      this.session.unpublish(this.publisher);
    }

    let newPublisher: Publisher = this.OV.initPublisher(undefined, {
      audioSource: undefined,
      videoSource: this.videoActive,
      publishAudio: this.audioActive,
      publishVideo: this.videoActive,
      resolution: '1920x1080',
      frameRate: 30,
      insertMode: 'APPEND',
      mirror: false
    });

    this.session.publish(newPublisher);

    this.mainStreamManager = newPublisher;
    this.publisher = newPublisher;

    this.mainStreamManager.addVideoElement(this.localVideo.nativeElement);
  }

  private deleteSubscriber(streamManager: StreamManager): void {
    let index = this.subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }

  private updateChatParticipants(users: any[]) {
    this.users = users;
  }

  private updateChat(message: ChatMessage) {

    this.chatMessages += message.username + ": " + message.entryText + '\n';
  }
}
