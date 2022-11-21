import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {KeycloakService} from "keycloak-angular";
import {Client} from "@stomp/stompjs";
import {UserResponseDto, UserResponsePage} from "../../../user/model/UserResponseDto";
import {TeamInvitation} from "../../../team/model/TeamInvitation";
import {User} from "../../../user/model/User";
import {MentorScheduleEntry} from "../../../mentor/model/MentorScheduleEntry";
import {NGXLogger} from "ngx-logger";
import * as dayjs from 'dayjs';
import {ScheduleEntryEvent} from "../../../user/model/ScheduleEntryEvent";
import * as isBetween from 'dayjs/plugin/isBetween'
import {ScheduleEntrySession} from "../../../mentor/model/ScheduleEntrySession";
import {MeetingNotification} from "../../../team/model/MeetingNotification";
import {NotificationType} from "../../../user/model/NotificationType";
import {Notification} from '../../../user/model/Notification';
import {TeamService} from "../team-service/team.service";


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userNotifications: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  userNotificationsObservable = this.userNotifications.asObservable();

  user!: User;

  private loadingSource = new BehaviorSubject(true);
  loading = this.loadingSource.asObservable();

  private keycloakUserId = "";

  constructor(private http: HttpClient, private keycloakService: KeycloakService, private logger: NGXLogger, private teamService: TeamService) {
    dayjs.extend(isBetween);
  }

  findHackathonUsersByUsername(username: string, hackathonId: number, pageNumber: number): Observable<UserResponsePage> {
    return this.http.get<UserResponsePage>
    ('http://localhost:9090/api/v1/read/users?username=' + username + '&hackathonId=' + hackathonId +
      "&page=" + pageNumber + "&size=10");
  }

  // Open ws connection

  async getKeycloakUserId(): Promise<string | undefined> {
    let userDetails = await this.keycloakService.loadUserProfile();
    return userDetails.id;
  }

  initWsConn(): void {

    this.getKeycloakUserId().then(v => {

      this.keycloakUserId = v!;

      // this.openWsConn(this.keycloakUserId);

      this.fetchUserData();
    });
  }

  openWsConn(kcUserId: string) {
    const client = new Client({
      brokerURL: 'ws://localhost:9090/hackathon-websocket',
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
      console.log('Erorr');
    }

    return this.keycloakUserId;
  }

  // TODO move to team service
  private fetchUserInvites() {
    this.http.get<TeamInvitation[]>('http://localhost:9090/api/v1/read/teams/invitations/' + this.user.id).subscribe(userInvites => {
      console.log('invites');
      console.log(userInvites);
      userInvites.map(inv => inv.notificationType = NotificationType.INVITATION);
      this.userNotifications.next(userInvites);
    });
  }

  private fetchUserData() {

    this.http.get<User>('http://localhost:9090/api/v1/read/users/keycloak/' + this.getKcId()).subscribe(userData => {
      this.user = userData;
      console.log(userData);

      localStorage.setItem("userId", String(userData.id));
      localStorage.setItem("username", userData.username);
      localStorage.setItem("user", JSON.stringify(userData));

      this.loadingSource.next(false);

      this.fetchUserInvites();

      this.sendUserScheduleNotification();
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
    const userId = localStorage.getItem("userId");

    if (userId) {
      return +userId;
    } else {
      throw new Error("User not loaded yet!");
    }

  }

  saveMentorSchedule(schedule: MentorScheduleEntry[]): Observable<any> {

    this.logger.info("Saving user " + this.getUserId() + " schedule");
    return this.http.post("http://localhost:9090/api/v1/write/users/" + this.getUserId() + "/schedule", schedule);
  }

  getUserSchedule(): Observable<ScheduleEntryEvent[]> {

    this.logger.info("Requesting user " + this.getUserId() + " schedule");
    return this.http.get<ScheduleEntryEvent[]>("http://localhost:9090/api/v1/read/users/" + this.getUserId() + "/schedule")
  }

  getUsersHackathonSchedule(): Observable<ScheduleEntryEvent[]> {

    this.logger.info("Requesting users " + this.getUserId() + " hackathon schedule");
    return this.http.get<ScheduleEntryEvent[]>("http://localhost:9090/api/v1/read/users/schedule?hackathonId=1")
  }

  assignTeamToMeetingWithMentor(teamId: any): Observable<any> {

    this.logger.info("Saving team meeting with mentor", teamId);
    return this.http.patch("http://localhost:9090/api/v1/write/users/schedule", teamId);
  }

  logout() {
    this.keycloakService.logout('http://localhost:4200').then((success) => {
      console.log("--> log: logout success ", success);
    }).catch((error) => {
      console.log("--> log: logout error ", error);
    });
  }

  get userHackathonId(): number {
    if (this.user.currentHackathonId) {
      return this.user.currentHackathonId;
    } else {
      throw new Error('err');
    }
  }

  get userTeamId(): number {
    if (this.user.currentTeamId) {
      return this.user.currentTeamId;
    } else {
      throw new Error('err');
    }
  }


  private sendUserScheduleNotification(index = 0) {

    // TODO if this.user is mentor...

    if (this.user) {
      this.getUserSchedulePlan().subscribe(schedule => {

        console.log(schedule);
        let meeting = schedule[index];

        const meetingNotification: MeetingNotification = {
          chatId: 0,
          teamId: meeting.teamId,
          notificationType: NotificationType.MEETING
        } as MeetingNotification;

        console.log(meetingNotification)

        this.teamService.getTeamById(meeting.teamId).subscribe(team => {

          meetingNotification.chatId = team.teamChatRoomId

          let meetingStart = dayjs(meeting.sessionStart).subtract(5, "minutes");
          let meetingEnd = dayjs(meeting.sessionEnd);

          const scheduleMonitorInterval = setInterval(() => {

            if (dayjs().isBetween(meetingStart, meetingEnd, 'minutes')) {

              this.userNotifications.next(this.userNotifications.value.concat(meetingNotification));

              meeting = schedule[++index];

              if (meeting) {
                this.sendUserScheduleNotification(index);
              } else {
                clearInterval(scheduleMonitorInterval);
              }
            }
          }, 10000);

          scheduleMonitorInterval;
        });
      });
    }
  }

  getUserSchedulePlan(): Observable<any[]> {
    return this.http.get<any[]>("http://localhost:9090/api/v1/read/users/" + this.getUserId() + "/schedule");
  }

  removeScheduleEntry(id: number) {
    return this.http.delete("http://localhost:9090/api/v1/write/users/schedule/" + id);
  }

  updateUserScheduleEntry(id: number, obj: ScheduleEntrySession): Observable<any> {
    return this.http.patch("http://localhost:9090/api/v1/write/users/schedule/" + id, obj)
  }

  getMembersByTeamId(teamId: number): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>("http://localhost:9090/api/v1/read/users/membership?teamId=" + teamId);
  }

  getParticipants(participantsIds: number[], pageNumber: number): Observable<UserResponsePage> {
    return this.http.post<UserResponsePage>
      ("http://localhost:9090/api/v1/read/users/hackathon-participants?page=" + pageNumber + "&size=10", participantsIds);
  }
}
