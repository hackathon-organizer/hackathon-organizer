import {Injectable} from '@angular/core';
import {BehaviorSubject, map, Observable, toArray} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {KeycloakService} from "keycloak-angular";
import {Client} from "@stomp/stompjs";
import {UserResponseDto, UserResponsePage} from "../../../user/model/UserResponseDto";
import {TeamInvitation} from "../../../team/model/TeamInvitation";
import {User, UserMembershipRequest} from "../../../user/model/User";
import {NGXLogger} from "ngx-logger";
import * as dayjs from 'dayjs';
import {
  ScheduleEntryEvent,
  ScheduleEntryRequest,
  ScheduleEntryResponse, TeamMeetingRequest
} from "../../../mentor/model/ScheduleEntryEvent";
import * as isBetween from 'dayjs/plugin/isBetween'
import {ScheduleEntrySession} from "../../../mentor/model/ScheduleEntrySession";
import {MeetingNotification} from "../../../team/model/MeetingNotification";
import {NotificationType} from "../../../user/model/NotificationType";
import {Notification} from '../../../user/model/Notification';
import {TeamService} from "../team-service/team.service";
import {Tag} from "../../../team/model/TeamRequest";
import {Utils} from "../../../shared/Utils";
import * as Util from "util";


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userNotifications: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  userNotificationsObservable = this.userNotifications.asObservable();

  user!: UserResponseDto;

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

  openWsConn() {
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

  private fetchUserData() {

    this.http.get<UserResponseDto>('http://localhost:9090/api/v1/read/users/keycloak/' + this.getKcId()).subscribe(userData => {
      this.user = userData;

      Utils.updateUserInLocalStorage(userData);

      this.updateTeamInLocalStorage(userData);

      this.sendNoTagsNotification(userData);

      // this.loadingSource.next(false);
      this.getUserTeamInvitations(userData);

      this.sendUserScheduleNotification();
    });
  }

  updateTeamInLocalStorage(userData: UserResponseDto) {
    if (userData.currentTeamId) {
      this.teamService.getTeamById(userData.currentTeamId as number).subscribe(teamResponse => {
          Utils.updateTeamInLocalStorage(teamResponse)
      });
    }
  }

  sendNoTagsNotification(userData: UserResponseDto) {
    if (userData.tags.length < 1) {
      this.userNotifications.next(
        this.userNotifications.value.concat({
          notificationType: NotificationType.TAGS,
          message: "Add some tags to get better team suggestions."
        } as Notification));
    }
  }

  getUserTeamInvitations(userData: UserResponseDto) {
    if (userData.currentHackathonId) {
      this.teamService.fetchUserInvites(userData.currentHackathonId).subscribe(userInvites => {
        userInvites.map(inv => inv.notificationType = NotificationType.INVITATION);
        this.userNotifications.next(userInvites);
      });
    }
  }

  get checkUserAccess(): boolean {

    const userRoles = this.keycloakService.getKeycloakInstance().realmAccess?.roles;
    const roles = ["MENTOR", "ORGANIZER", "JURY"];

    return roles.some(role => userRoles?.includes(role));
  }

  get isUserTeamOwner(): boolean {
    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes("TEAM_OWNER");
  }

  getUserId(): number {
  return Utils.currentUserFromLocalStorage.id;
  }

  createEntryEvent(entryEvent: ScheduleEntryRequest): Observable<any> {

    this.logger.info("Saving user " + this.getUserId() + " schedule");
    return this.http.post("http://localhost:9090/api/v1/write/users/" + this.getUserId() + "/schedule", entryEvent);
  }

  updateEntryEvents(userId: number, schedule: ScheduleEntryRequest[]): Observable<any> {

    this.logger.info("Saving user " + this.getUserId() + " schedule");
    return this.http.put("http://localhost:9090/api/v1/write/users/" + userId + "/schedule", schedule);
  }

  getUserSchedule(hackathonId: number): Observable<ScheduleEntryResponse[]> {

    this.logger.info("Requesting user " + this.getUserId() + " schedule");
    return this.http.get<ScheduleEntryResponse[]>("http://localhost:9090/api/v1/read/users/" + this.getUserId() + "/schedule?hackathonId=" + hackathonId);
  }

  getHackathonSchedule(hackathonId: number): Observable<ScheduleEntryResponse[]> {

    this.logger.info("Requesting hackathon " + hackathonId + " schedule");
    return this.http.get<ScheduleEntryResponse[]>("http://localhost:9090/api/v1/read/users/schedule?hackathonId=" + hackathonId)
  }

  assignTeamToMeetingWithMentor(entryId: number, scheduleEntry: TeamMeetingRequest): Observable<any> {

    this.logger.info("Saving team meeting with mentor ", scheduleEntry);
    return this.http.patch("http://localhost:9090/api/v1/write/users/schedule/" + entryId + "/meeting", scheduleEntry);
  }

  logout() {

    this.keycloakService.logout('http://localhost:4200').then((success) => {
      console.log("--> log: logout success ", success);
    }).catch((error) => {
      console.log("--> log: logout error ", error);
    });
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

  removeScheduleEntry(userId: number, entryId: number) {

    return this.http.delete("http://localhost:9090/api/v1/write/users/" + userId + "/schedule/" + entryId);
  }

  updateUserScheduleEntry(userId: number, entryId: number, entrySession: ScheduleEntrySession): Observable<any> {

    return this.http.patch("http://localhost:9090/api/v1/write/users/" + userId + "/schedule/" + entryId, entrySession)
  }

  getMembersByTeamId(teamId: number): Observable<UserResponseDto[]> {

    return this.http.get<UserResponseDto[]>("http://localhost:9090/api/v1/read/users/membership?teamId=" + teamId);
  }

  getParticipants(participantsIds: number[], pageNumber: number): Observable<UserResponsePage> {

    return this.http.post<UserResponsePage>
    ("http://localhost:9090/api/v1/read/users/hackathon-participants?page=" + pageNumber + "&size=10", participantsIds);
  }

  updateUserProfile(updatedUser: {}, userId: number) {

    return this.http.patch<UserResponsePage>("http://localhost:9090/api/v1/write/users/" + userId, updatedUser);
  }

  getTags() {

    return this.http.get<Tag[]>("http://localhost:9090/api/v1/read/users/tags");
    //   .pipe(map(tags => tags.map(tag => ({
    //   ...tag, isSelected: false
    // }))));
  }

  updateUserMembership(updatedUserMembership: UserMembershipRequest): Observable<any> {

    const currentUserId = Utils.currentUserTeamFromLocalStorage.id;
    updatedUserMembership.userId = currentUserId;

    return this.http.patch("http://localhost:9090/api/v1/read/write/" + currentUserId + "/membership", updatedUserMembership);
  }
}
