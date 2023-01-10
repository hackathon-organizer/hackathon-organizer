import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {KeycloakService} from "keycloak-angular";
import {Client, IMessage} from "@stomp/stompjs";
import {UserMembershipRequest, UserResponse, UserResponsePage} from "../../../user/model/User";
import {NGXLogger} from "ngx-logger";
import * as dayjs from 'dayjs';
import {
  ScheduleEntryRequest,
  ScheduleEntryResponse,
  ScheduleEntrySession,
  TeamMeetingRequest
} from "../../../mentor/model/ScheduleEntryEvent";
import * as isBetween from 'dayjs/plugin/isBetween'
import {NotificationType} from "../../../user/model/NotificationType";
import {TeamService} from "../team-service/team.service";
import {Tag} from "../../../team/model/Team";
import {UserManager} from "../../../shared/UserManager";
import {MeetingNotification, Notification, TeamInvitationNotification} from "../../../team/model/Notifications";
import {Role} from "../../../user/model/Role";
import {RouterStateSnapshot, UrlTree} from "@angular/router";
import {ToastrService} from "ngx-toastr";


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userNotifications: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  userNotificationsObservable = this.userNotifications.asObservable();

  user!: UserResponse;

  private loadingSource = new BehaviorSubject(true);
  loading = this.loadingSource.asObservable();

  private keycloakUserId = "";

  constructor(private http: HttpClient,
              private keycloakService: KeycloakService,
              private logger: NGXLogger,
              private toastr: ToastrService,
              private teamService: TeamService) {

    dayjs.extend(isBetween);
  }

  findHackathonUsersByUsername(username: string, hackathonId: number, pageNumber: number): Observable<UserResponsePage> {
    return this.http.get<UserResponsePage>
    ('http://localhost:9090/api/v1/read/users?username=' + username + '&hackathonId=' + hackathonId +
      "&page=" + pageNumber + "&size=10");
  }

  async getKeycloakUserId(): Promise<string | undefined> {
    let userDetails = await this.keycloakService.loadUserProfile();
    return userDetails.id;
  }

  initWsConn(): void {

    this.getKeycloakUserId().then(v => {

      this.keycloakUserId = v!;
      this.fetchUserData();
    });
  }

  openWsConn() {

    const client = new Client({
      brokerURL: 'ws://localhost:9090/hackathon-websocket?sessionId=' + this.user.id,
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {

      console.log("CONNECTING...");
      client.subscribe('/user/topic/invitations', (message: IMessage) => {

        const invite: TeamInvitationNotification = JSON.parse(message.body);
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

  getUserById(userId: number): Observable<UserResponse> {
    return this.http.get<UserResponse>("http://localhost:9090/api/v1/read/users/" + userId);
  }

  public getKcId(): string {

    if (!this.keycloakUserId) {
      console.log('Erorr');
    }

    return this.keycloakUserId;
  }

  private fetchUserData() {

    this.http.get<UserResponse>('http://localhost:9090/api/v1/read/users/keycloak/' + this.getKcId()).subscribe(userData => {
      this.user = userData;

      UserManager.updateUserInLocalStorage(userData);

      this.updateTeamInLocalStorage(userData);

      this.sendNoTagsNotification(userData);

      // this.loadingSource.next(false);
      this.getUserTeamInvitations(userData);

      this.sendUserScheduleNotification();

      this.openWsConn();
    });
  }

  updateTeamInLocalStorage(userData: UserResponse) {
    if (userData.currentTeamId) {
      this.teamService.getTeamById(userData.currentTeamId as number).subscribe(teamResponse => {
        UserManager.updateTeamInLocalStorage(teamResponse)
      });
    }
  }

  sendNoTagsNotification(userData: UserResponse) {

    if (userData.tags.length < 1) {
      this.userNotifications.next(
        this.userNotifications.value.concat({
          notificationType: NotificationType.TAGS,
          message: "Add some tags to get better team suggestions."
        } as Notification));
    }
  }

  getUserTeamInvitations(userData: UserResponse) {
    if (userData.currentHackathonId) {
      this.teamService.fetchUserInvites(userData.currentHackathonId).subscribe(userInvites => {
        userInvites.map(invitation => {
          invitation.message = `User ${invitation.fromUserName} invited you to team ${invitation.teamName}`;
          invitation.notificationType = NotificationType.INVITATION
        });
        this.userNotifications.next(this.userNotifications.value.concat(userInvites));
      });
    }
  }

  get checkUserAccess(): boolean {

    const userRoles = this.keycloakService.getKeycloakInstance().realmAccess?.roles;
    const roles = ["MENTOR", "ORGANIZER"];

    return roles.some(role => userRoles?.includes(role));
  }

  isUserHackathonOwner(hackathonId: number): boolean {

    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes("ORGANIZER") &&
      this.user.currentHackathonId === hackathonId;
  }

  getUserId(): number {
    return UserManager.currentUserFromLocalStorage.id;
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

    // TODO concat map

    if (this.checkUserAccess && this.user.currentHackathonId) {
      this.getUserSchedulePlan(this.user.currentHackathonId).subscribe(schedule => {

        let meeting = schedule[index];

        if (meeting && meeting.teamId) {

          this.teamService.getTeamById(meeting.teamId).subscribe(teamResponse => {

          const meetingNotification: MeetingNotification = {
            chatId: teamResponse.teamChatRoomId,
            message: `Meeting with team ${teamResponse.name}`,
            notificationType: NotificationType.MEETING
          } as MeetingNotification;

          let meetingStart = dayjs(meeting.sessionStart).subtract(5, "minutes");
          let meetingEnd = dayjs(meeting.sessionEnd);

          // const scheduleMonitorInterval = setInterval(() => {

            if (dayjs().isBetween(meetingStart, meetingEnd, 'minutes')) {

              this.userNotifications.next(this.userNotifications.value.concat(meetingNotification));

              meeting = schedule[++index];

              if (meeting) {
                this.sendUserScheduleNotification(index);
              } else {
                //clearInterval(scheduleMonitorInterval);
              }
            }
          // }, 10000);
          //
          // scheduleMonitorInterval;
        });
        }
      });
    }
  }

  getUserSchedulePlan(hackathonId: number): Observable<ScheduleEntryResponse[]> {

    return this.http.get<ScheduleEntryResponse[]>("http://localhost:9090/api/v1/read/users/" + this.getUserId() + "/schedule",
      {params: {
        hackathonId: hackathonId
      }});
  }

  updateUserRole(userId: number, role: Role): Observable<void> {

    return this.http.patch<void>(`http://localhost:9090/api/v1/write/users/${userId}/roles`, role);
  }

  removeScheduleEntry(userId: number, entryId: number) {

    return this.http.delete("http://localhost:9090/api/v1/write/users/" + userId + "/schedule/" + entryId);
  }

  updateUserScheduleEntryTime(userId: number, entryId: number, entrySession: ScheduleEntrySession): Observable<any> {

    return this.http.patch("http://localhost:9090/api/v1/write/users/" + userId + "/schedule/" + entryId, entrySession)
  }

  getMembersByTeamId(teamId: number): Observable<UserResponse[]> {

    return this.http.get<UserResponse[]>("http://localhost:9090/api/v1/read/users/membership?teamId=" + teamId);
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

    const currentUserId = UserManager.currentUserFromLocalStorage.id;
    updatedUserMembership.userId = currentUserId;

    return this.http.patch("http://localhost:9090/api/v1/write/users/" + currentUserId + "/membership", updatedUserMembership);
  }

  removeTagsNotification() {
    const toRemoveIdx = this.userNotifications.value.indexOf(
      <Notification>this.userNotifications.value.find(notification => notification.notificationType === NotificationType.TAGS));

    this.userNotifications.value.splice(toRemoveIdx, 1);
  }

  login() {

    this.keycloakService.login();
  }

  isLoggedIn() {
    return this.keycloakService.isLoggedIn();
  }

  isUserJury(hackathonId: number): boolean {

    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes(Role.JURY) &&
      Number(UserManager.currentUserFromLocalStorage.currentHackathonId) === Number(hackathonId);
  }

  isUserOrganizer(hackathonId: number): boolean {

    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes(Role.ORGANIZER) &&
      Number(UserManager.currentUserFromLocalStorage.currentHackathonId) === Number(hackathonId);
  }

  isUserMentor(hackathonId: number) {
    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes(Role.MENTOR) &&
      Number(UserManager.currentUserFromLocalStorage.currentHackathonId) === Number(hackathonId);
  }

  isUserTeamOwner(teamId: number) {
    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes(Role.TEAM_OWNER) &&
      Number(UserManager.currentUserFromLocalStorage.currentTeamId) === Number(teamId);
  }
}
