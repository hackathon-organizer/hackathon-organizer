import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {KeycloakService} from "keycloak-angular";
import {Client} from "@stomp/stompjs";
import {UserResponseDto} from "../../../user/model/UserResponseDto";
import {TeamInvitation} from "../../../user/model/TeamInvitation";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userNotifications: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  userNotificationsObservable = this.userNotifications.asObservable();

  keycloakUserId = "";

  constructor(private http: HttpClient, private keycloakService: KeycloakService) {

    this.initWsConn();
  }

  findUsersByUsername(username: string): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>('http://localhost:9090/users?username=' + username);
  }

  // Open ws connection

  async getKeycloakUserId(): Promise<string | undefined> {
    let userDetails = await this.keycloakService.loadUserProfile();
    return userDetails.id;
  }

  initWsConn(): void {

    this.getKeycloakUserId().then(v => {

      this.keycloakUserId = v!;

      this.openWsConn(this.keycloakUserId);
    });
  }

  openWsConn(kcUserId: string) {
    const client = new Client({
      brokerURL: 'ws://localhost:9090/hackathon-websocket?userId=' + kcUserId,
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
      console.log("CONNECTING...");
      client.subscribe('/user/topic/private-notifications', (message: any) => {
        // called when the client receives a STOMP message from the server

        const invite = message.body as TeamInvitation;

        console.log(invite);

        this.userNotifications.next(Object.assign([], invite));
      });
    };

    client.onStompError = function (frame) {
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);
    };

    client.activate();
  }

  getUserById(userId: number): Observable<UserResponseDto> {
    return this.http.get<UserResponseDto>("http://localhost:9090/users/" + userId);
  }
}
