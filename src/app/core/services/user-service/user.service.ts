import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {KeycloakService} from "keycloak-angular";
import {Client, IMessage} from "@stomp/stompjs";
import {UserResponseDto, UserResponsePage} from "../../../user/model/UserResponseDto";
import {TeamInvitation} from "../../../team/model/TeamInvitation";
import {UserMembershipRequest} from "../../../user/model/User";
import {NGXLogger} from "ngx-logger";
import * as dayjs from 'dayjs';
import {
  ScheduleEntryRequest,
  ScheduleEntryResponse,
  ScheduleEntrySession,
  TeamMeetingRequest
} from "../../../mentor/model/ScheduleEntryEvent";
import * as isBetween from 'dayjs/plugin/isBetween'
import {MeetingNotification} from "../../../team/model/MeetingNotification";
import {NotificationType} from "../../../user/model/NotificationType";
import {Notification} from '../../../user/model/Notification';
import {TeamService} from "../team-service/team.service";
import {Tag} from "../../../team/model/TeamRequest";
import {Utils} from "../../../shared/Utils";


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


      this.fetchUserData();

      // this.openWsConn();

    });
  }

  openWsConn() {

    console.log('connectiong to ' + 'ws://localhost:9090/hackathon-websocket?sessionId=' + this.user.id);

    const client = new Client({
      brokerURL: 'ws://localhost:9090/hackathon-websocket?sessionId=' + this.user.id,
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    console.log("new")


    client.onConnect = (frame) => {
      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
      console.log("CONNECTING...");
      client.subscribe('/user/topic/invitations', (message: IMessage) => {
        // called when the client receives a STOMP message from the server

        const invite: TeamInvitation = JSON.parse(message.body) as TeamInvitation;
        invite.message = `User ${invite.fromUserName} invited you to team ${invite.teamName}`;
        invite.notificationType = NotificationType.INVITATION;
        this.userNotifications.next(this.userNotifications.value.concat(invite));

      });
    }

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

      this.openWsConn();
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
        this.userNotifications.next(this.userNotifications.value.concat(userInvites));
      });
    }
  }

  get checkUserAccess(): boolean {

    const userRoles = this.keycloakService.getKeycloakInstance().realmAccess?.roles;
    const roles = ["MENTOR", "ORGANIZER", "JURY"];

    return roles.some(role => userRoles?.includes(role));
  }

  isUserTeamOwner(teamId: number): boolean {

    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes("TEAM_OWNER") &&
      this.user.currentTeamId === teamId;
  }

  isUserHackathonOwner(hackathonId: number): boolean {

    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes("ORGANIZER") &&
      this.user.currentHackathonId === hackathonId;
  }

  getUserId(): number {
    return Utils.currentUserFromLocalStorage.id;
  }

  createEntryEvent(entryEvent: ScheduleEntryRequest): Observable<ScheduleEntryResponse> {

    this.logger.info("Saving user " + this.getUserId() + " schedule");
    return this.http.post<ScheduleEntryResponse>("http://localhost:9090/api/v1/write/users/" + this.getUserId() + "/schedule", entryEvent);
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

    if (this.checkUserAccess) {
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
  }

  updateUserMembership(updatedUserMembership: UserMembershipRequest): Observable<any> {

    const currentUserId = Utils.currentUserFromLocalStorage.id;
    updatedUserMembership.userId = currentUserId;

    return this.http.patch("http://localhost:9090/api/v1/write/users/" + currentUserId + "/membership", updatedUserMembership);
  }

  removeTagsNotification() {
    const toRemoveIdx = this.userNotifications.value.indexOf(
      <Notification>this.userNotifications.value.find(notification => notification.notificationType === NotificationType.TAGS));

    this.userNotifications.value.splice(toRemoveIdx, 1);
  }
}
