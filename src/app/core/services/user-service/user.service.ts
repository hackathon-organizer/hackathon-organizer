import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {KeycloakService} from "keycloak-angular";
import {Client, IMessage} from "@stomp/stompjs";
import {UserDetails, UserMembershipRequest, UserResponse, UserResponsePage} from "../../../user/model/User";
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
import {ToastrService} from "ngx-toastr";


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userNotifications: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  userNotificationsObservable = this.userNotifications.asObservable();
  user!: UserResponse;

  BASE_URL_UPDATE = "http://localhost:9090/api/v1/write/users/";
  BASE_URL_READ = "http://localhost:9090/api/v1/read/users/";

  constructor(private http: HttpClient,
              private keycloakService: KeycloakService,
              private logger: NGXLogger,
              private toastr: ToastrService,
              private teamService: TeamService) {

    dayjs.extend(isBetween);

    this.getKeycloakUserId().then((keycloakId) => {
      this.fetchUserData(keycloakId);
    });
  }

  findHackathonUsersByUsername(username: string, hackathonId: number, pageNumber: number): Observable<UserResponsePage> {
    return this.http.get<UserResponsePage>(this.BASE_URL_READ, {
      params: {
        username: username,
        hackathonId: hackathonId,
        page: pageNumber,
        size: 10
      }
    });
  }

  private async getKeycloakUserId(): Promise<string | undefined> {
    let userDetails = await this.keycloakService.loadUserProfile();
    return userDetails.id;
  }

  private openNotificationWebSocketConnection(): void {

    const client = new Client({
      brokerURL: 'ws://localhost:9090/hackathon-websocket?sessionId=' + this.user.id,
      debug: (message) => {
        this.logger.info(message);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {

      this.logger.info("Connecting to invitations service");
      client.subscribe('/user/topic/invitations', (message: IMessage) => {

        const invite: TeamInvitationNotification = JSON.parse(message.body);
        invite.message = `User ${invite.fromUserName} invited you to team ${invite.teamName}`;
        invite.notificationType = NotificationType.INVITATION;
        this.userNotifications.next(this.userNotifications.value.concat(invite));

        this.logger.info("Invitation fetched: ", invite)
      });
    }

    client.onStompError = (frame) => {
      this.logger.error('Broker reported error: ' + frame.headers['message'] + "\n Additional details: " + frame.body);
    };

    client.activate();
  }

  getUserById(userId: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(this.BASE_URL_READ + userId);
  }

  private fetchUserData(keycloakId?: string): void {

    this.http.get<UserResponse>(this.BASE_URL_READ + 'keycloak/' + keycloakId).subscribe(userData => {
      this.user = userData;

      UserManager.updateUserInLocalStorage(userData);

      this.fetchAndUpdateTeamInLocalStorage(userData);
      this.sendNoTagsNotification(userData);
      this.getUserTeamInvitations(userData);
      this.sendUserScheduleNotification();
      this.openNotificationWebSocketConnection();
    });
  }

  fetchAndUpdateTeamInLocalStorage(userData: UserResponse): void {
    if (userData.currentTeamId) {
      this.teamService.getTeamById(userData.currentTeamId as number).subscribe(teamResponse => {
        UserManager.updateTeamInLocalStorage(teamResponse)
      });
    }
  }

  private sendNoTagsNotification(userData: UserResponse): void {

    if (userData.tags.length < 1) {
      this.userNotifications.next(this.userNotifications.value.concat({
        notificationType: NotificationType.TAGS,
        message: "Add some tags to get better team suggestions."
      } as Notification));
    }
  }

  private getUserTeamInvitations(userData: UserResponse): void {

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

  isUserMentorOrOrganizer(hackathonId: number): boolean {

    const userRoles = this.keycloakService.getKeycloakInstance().realmAccess?.roles;

    return userRoles!.some(role => role === Role.ORGANIZER || role === Role.MENTOR) &&
      Number(this.user?.currentHackathonId) === Number(hackathonId);
  }

  isUserHackathonOwner(hackathonId: number): boolean {

    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes("ORGANIZER") &&
      Number(this.user.currentHackathonId) ===  Number(hackathonId);
  }

  private getUserId(): number {
    return UserManager.currentUserFromLocalStorage.id;
  }

  createEntryEvent(entryEvent: ScheduleEntryRequest): Observable<ScheduleEntryResponse> {

    this.logger.info("Saving user " + this.getUserId() + " schedule: ", entryEvent);
    return this.http.post<ScheduleEntryResponse>(this.BASE_URL_UPDATE + this.getUserId() + "/schedule", entryEvent);
  }

  updateEntryEvents(schedule: ScheduleEntryRequest[]): Observable<void> {

    this.logger.info("Saving user " + this.getUserId() + " schedule: ", schedule);
    return this.http.put<void>(this.BASE_URL_UPDATE + this.getUserId() + "/schedule", schedule);
  }

  getUserSchedule(hackathonId: number): Observable<ScheduleEntryResponse[]> {

    this.logger.info("Requesting user " + this.getUserId() + " schedule");
    return this.http.get<ScheduleEntryResponse[]>(this.BASE_URL_READ + this.getUserId() + "/schedule", {
      params: {
        hackathonId: hackathonId
      }
    });
  }

  getHackathonSchedule(hackathonId: number): Observable<ScheduleEntryResponse[]> {

    this.logger.info("Requesting hackathon " + hackathonId + " schedule");
    return this.http.get<ScheduleEntryResponse[]>(this.BASE_URL_READ + "/schedule", {
      params: {
        hackathonId: hackathonId
      }
    });
  }

  assignTeamToMeetingWithMentor(entryId: number, scheduleEntry: TeamMeetingRequest): Observable<boolean> {

    this.logger.info("Saving team meeting with mentor ", scheduleEntry);
    return this.http.patch<boolean>(this.BASE_URL_UPDATE + "schedule/" + entryId + "/meeting", scheduleEntry);
  }

  logout() {

    this.keycloakService.logout('http://localhost:4200').then((success) => {
      this.logger.info("logout success ", success);
    }).catch((error) => {
      this.logger.info("logout error ", error);
    });
  }

  private sendUserScheduleNotification(index = 0) {

    if (this.user.currentHackathonId && this.isUserMentorOrOrganizer(this.user.currentHackathonId)) {
      this.getUserSchedule(this.user.currentHackathonId).subscribe(schedule => {

        let meeting = schedule[index];

        if (meeting && meeting.teamId) {

          this.teamService.getTeamById(meeting.teamId).subscribe(teamResponse => {

            const meetingNotification: MeetingNotification = {
              chatId: teamResponse.teamChatRoomId,
              message: `Meeting with team ${teamResponse.name}`,
              notificationType: NotificationType.MEETING
            } as MeetingNotification;

            let meetingStart = dayjs(meeting.sessionStart).subtract(10, "minutes");
            let meetingEnd = dayjs(meeting.sessionEnd);

            if (dayjs().isBetween(meetingStart, meetingEnd, 'minutes')) {

              this.userNotifications.next(this.userNotifications.value.concat(meetingNotification));

              meeting = schedule[++index];

              if (meeting) {
                this.sendUserScheduleNotification(index);
              }
            }
          });
        }
      });
    }
  }

  updateUserRole(userId: number, role: Role): Observable<void> {

    const newRole = {role: role}
    this.logger.info("Updating user " + userId + " role: ", newRole);
    return this.http.patch<void>(this.BASE_URL_UPDATE + userId + "/roles", newRole);
  }

  removeScheduleEntry(userId: number, entryId: number): Observable<void> {

    this.logger.info("Removing user " + userId + " schedule entry: ", entryId);
    return this.http.delete<void>(this.BASE_URL_UPDATE + userId + "/schedule/" + entryId);
  }

  updateUserScheduleEntryTime(userId: number, entryId: number, entrySession: ScheduleEntrySession): Observable<void> {

    this.logger.info("Updating user " + userId + " schedule entry: ", entryId, entrySession);
    return this.http.patch<void>(this.BASE_URL_UPDATE + userId + "/schedule/" + entryId, entrySession)
  }

  getMembersByTeamId(teamId: number): Observable<UserResponse[]> {

    this.logger.info("Requesting members of team " + teamId);
    return this.http.get<UserResponse[]>(this.BASE_URL_READ + "membership", {
      params: {
        teamId: teamId
      }
    });
  }

  getParticipants(participantsIds: number[], pageNumber: number): Observable<UserResponsePage> {

    this.logger.info("Requesting participants");
    return this.http.post<UserResponsePage>(this.BASE_URL_READ + "hackathon-participants", participantsIds, {
        params: {
         page: pageNumber,
         size: 10
        }
    });
  }

  updateUserProfile(updatedUser: UserDetails): Observable<UserResponsePage> {

    this.logger.info("Updating user " + this.getUserId() + " profile: ", updatedUser);
    return this.http.patch<UserResponsePage>(this.BASE_URL_UPDATE + this.getUserId(), updatedUser);
  }

  getTags(): Observable<Tag[]> {

    this.logger.info("Requesting tags ");
    return this.http.get<Tag[]>(this.BASE_URL_READ + "tags");
  }

  updateUserMembership(updatedUserMembership: UserMembershipRequest): Observable<void> {

    this.logger.info("Updating user " + this.getUserId() + " membership", updatedUserMembership);
    updatedUserMembership.userId = this.getUserId();

    return this.http.patch<void>(this.BASE_URL_UPDATE + this.getUserId() + "/membership", updatedUserMembership);
  }

  removeTagsNotification(): void {
    const toRemoveIdx = this.userNotifications.value.indexOf(
      <Notification>this.userNotifications.value.find(notification => notification.notificationType === NotificationType.TAGS));

    this.userNotifications.value.splice(toRemoveIdx, 1);
  }

  login(): void {
    this.keycloakService.login().then(() =>this.toastr.success("Login successful"));
  }

  isLoggedIn(): Promise<boolean> {
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

  isUserTeamOwnerInHackathon(hackathonId: number) {
    return !!this.keycloakService.getKeycloakInstance().realmAccess?.roles.includes(Role.TEAM_OWNER) &&
      Number(UserManager.currentUserFromLocalStorage.currentHackathonId) === Number(hackathonId);
  }
}
