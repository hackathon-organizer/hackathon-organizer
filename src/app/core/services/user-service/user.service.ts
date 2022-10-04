import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {KeycloakService} from "keycloak-angular";
import {Client} from "@stomp/stompjs";
import {UserResponseDto} from "../../../user/model/UserResponseDto";
import {TeamInvitation} from "../../../team/model/TeamInvitation";
import {User} from "../../../user/model/User";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userNotifications: BehaviorSubject<TeamInvitation[]> = new BehaviorSubject<TeamInvitation[]>([]);
  userNotificationsObservable = this.userNotifications.asObservable();

  user!: User;

  private keycloakUserId = "";

  constructor(private http: HttpClient, private keycloakService: KeycloakService) {

    this.initWsConn();
  }

  findUsersByUsername(username: string): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>('http://localhost:9090/api/v1/read/users?username=' + username);
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

      this.fetchUserData();
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

        const invite: TeamInvitation = JSON.parse(message.body) as TeamInvitation;

        console.log(invite as TeamInvitation);

        this.userNotifications.next(this.userNotifications.value.concat(invite));
      });
    };

    client.onStompError = function (frame) {
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);
    };

    client.activate();
  }

  getUserById(userId: number): Observable<UserResponseDto> {
    return this.http.get<UserResponseDto>("http://localhost:9090/api/v1/read/users/" + userId);
  }

  public getKcId(): string {

    if (!this.keycloakUserId) {
      console.log('Erorr')   ;
    }

    return this.keycloakUserId;
  }

  private fetchUserInvites() {
    this.http.get<TeamInvitation[]>('http://localhost:9090/api/v1/read/teams/invites/' + this.user.id).subscribe(userInvites => {
      this.userNotifications.next(userInvites);
  });
  }

  private fetchUserData() {
    this.http.get<User>('http://localhost:9090/api/v1/read/users/kc/' + this.getKcId()).subscribe(userData => {
      this.user = userData;
      console.log(userData);

      this.fetchUserInvites();
    });
  }

  getUsername(): string {
    if (this.user) {
      return this.user.username;
    } else {
      throw new Error("User not loaded yet!");
    }
  }

  getUserId(): number {
     if (this.user.id) {
       return this.user.id;
     } else {
       throw new Error("User not loaded yet!");
     }
  }

  logout() {
    this.keycloakService.logout('http://localhost:4200').then((success) => {
      console.log("--> log: logout success ", success );
    }).catch((error) => {
      console.log("--> log: logout error ", error );
    });
  }
}
