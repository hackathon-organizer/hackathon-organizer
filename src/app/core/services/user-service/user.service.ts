import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, finalize, Observable, take} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {Client, IMessage} from "@stomp/stompjs";
import {UserDetails, UserMembershipRequest, UserResponse, UserResponsePage} from "../../../user/model/User";
import {NGXLogger} from "ngx-logger";
import * as dayjs from 'dayjs';
import {
  ScheduleEntryRequest,
  ScheduleEntryResponse,
  ScheduleEntrySession,
  TeamMeetingRequest
} from "../../../mentor/model/ScheduleEntry";
import * as isBetween from 'dayjs/plugin/isBetween'
import {NotificationType} from "../../../user/model/NotificationType";
import {TeamService} from "../team-service/team.service";
import {Tag} from "../../../team/model/Team";
import {UserManager} from "../../../shared/UserManager";
import {MeetingNotification, Notification, TeamInvitationNotification} from "../../../team/model/Notifications";
import {Role} from "../../../user/model/Role";
import {ToastrService} from "ngx-toastr";
import {environment} from "../../../../environments/environment";
import {LoginResponse, OidcSecurityService} from "angular-auth-oidc-client";
import jwtDecode, {JwtPayload} from "jwt-decode";

type userAccess = {
  roles: string[];
};

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {

  private BASE_URL_UPDATE = environment.API_URL + "/api/v1/write/users/";
  private BASE_URL_READ = environment.API_URL + "/api/v1/read/users/";

  user!: UserResponse;
  private userNotifications: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  userNotificationsObservable = this.userNotifications.asObservable();
  private accessToken?: string | null;
  private isUserAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  isUserAuthenticatedObservable = this.isUserAuthenticated.asObservable();
  private userLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  userLoadedObservable = this.userLoaded.asObservable();

  constructor(private http: HttpClient,
              private logger: NGXLogger,
              private oidcSecurityService: OidcSecurityService,
              private toastr: ToastrService,
              private teamService: TeamService) {

    dayjs.extend(isBetween);
    this.updateUserData();
  }

  findHackathonUsersByUsername(username: string, hackathonId: number, pageNumber: number): Observable<UserResponsePage> {

    return this.http.get<UserResponsePage>(this.BASE_URL_READ.slice(0, -1), {
      params: {
        username: username,
        hackathonId: hackathonId,
        page: pageNumber,
        size: 10
      }
    });
  }

  getUserById(userId: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(this.BASE_URL_READ + userId);
  }

  fetchAndUpdateTeamInStorage(userData: UserResponse): void {

    if (userData.currentTeamId) {
      this.teamService.getTeamById(userData.currentTeamId as number).subscribe(teamResponse => {
        UserManager.updateTeamInStorage(teamResponse)
      });
    }
  }

  createEntryEvent(entryEvent: ScheduleEntryRequest): Observable<ScheduleEntryResponse> {
    return this.http.post<ScheduleEntryResponse>(this.BASE_URL_UPDATE + this.getUserId() + "/schedule", entryEvent);
  }

  updateEntryEvents(schedule: ScheduleEntryRequest[]): Observable<void> {
    return this.http.put<void>(this.BASE_URL_UPDATE + this.getUserId() + "/schedule", schedule);
  }

  getUserSchedule(hackathonId: number): Observable<ScheduleEntryResponse[]> {
    return this.http.get<ScheduleEntryResponse[]>(this.BASE_URL_READ + this.getUserId() + "/schedule", {
      params: {
        hackathonId: hackathonId
      }
    });
  }

  getHackathonSchedule(hackathonId: number): Observable<ScheduleEntryResponse[]> {
    return this.http.get<ScheduleEntryResponse[]>(this.BASE_URL_READ + "/schedule", {
      params: {
        hackathonId: hackathonId
      }
    });
  }

  assignTeamToMeetingWithMentor(entryId: number, scheduleEntry: TeamMeetingRequest): Observable<boolean> {
    return this.http.patch<boolean>(this.BASE_URL_UPDATE + "schedule/" + entryId + "/meeting", scheduleEntry);
  }

  updateUserRole(userId: number, role: Role): Observable<void> {

    const newRole = {role: role}
    return this.http.patch<void>(this.BASE_URL_UPDATE + userId + "/roles", newRole);
  }

  removeScheduleEntry(userId: number, entryId: number): Observable<void> {
    return this.http.delete<void>(this.BASE_URL_UPDATE + userId + "/schedule/" + entryId);
  }

  updateUserScheduleEntryTime(userId: number, entryId: number, entrySession: ScheduleEntrySession): Observable<void> {
    return this.http.patch<void>(this.BASE_URL_UPDATE + userId + "/schedule/" + entryId, entrySession)
  }

  getMembersByTeamId(teamId: number): Observable<UserResponse[]> {

    return this.http.get<UserResponse[]>(this.BASE_URL_READ + "membership", {
      params: {
        teamId: teamId
      }
    });
  }

  getParticipants(participantsIds: number[], pageNumber: number): Observable<UserResponsePage> {

    return this.http.post<UserResponsePage>(this.BASE_URL_READ + "hackathon-participants", participantsIds, {
      params: {
        page: pageNumber,
        size: 10
      }
    });
  }

  updateUserProfile(updatedUser: UserDetails): Observable<UserResponsePage> {
    return this.http.patch<UserResponsePage>(this.BASE_URL_UPDATE + this.getUserId(), updatedUser);
  }

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.BASE_URL_READ + "tags");
  }

  updateUserMembership(updatedUserMembership: UserMembershipRequest): Observable<void> {

    updatedUserMembership.userId = this.getUserId();
    return this.http.patch<void>(this.BASE_URL_UPDATE + this.getUserId() + "/membership", updatedUserMembership);
  }

  removeTagsNotification(): void {

    const toRemoveIdx = this.userNotifications.value.indexOf(
      <Notification>this.userNotifications.value.find(notification => notification.notificationType === NotificationType.TAGS));

    this.userNotifications.value.splice(toRemoveIdx, 1);
  }

  private openNotificationWebSocketConnection(): void {

    const WS_API_URL = environment.API_URL.replace(new RegExp("(http|https)"), "ws");

    const client = new Client({
      brokerURL: WS_API_URL + '/hackathon-websocket?sessionId=' + this.user.id,
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

        this.toastr.info("Invitation to team " + invite.teamName + " received");
        this.logger.info("Invitation fetched: ", invite)
      });
    }

    client.onStompError = (frame) => {
      this.logger.error('Broker reported error: ' + frame.headers['message'] + "\n Additional details: " + frame.body);
    };

    client.activate();
  }

is!: boolean;
  updateUserData(): void {

      this.oidcSecurityService.checkAuth().pipe(take(1)).subscribe(isLoggedIn => {

        this.isUserAuthenticated.next(isLoggedIn.isAuthenticated)

        if (isLoggedIn.isAuthenticated) {
          this.oidcSecurityService.userData$.subscribe((userProfile) => {

            const keycloakId = userProfile.userData.sub;
            console.log(userProfile.userData)

            this.http.get<UserResponse>(this.BASE_URL_READ + 'keycloak/' + keycloakId).subscribe(userData => {
              this.user = userData;

              UserManager.updateUserInStorage(userData);
              this.fetchAndUpdateTeamInStorage(userData);
              this.userLoaded.next(true);
              this.sendNoTagsNotification(userData);
              this.getUserTeamInvitations(userData);
              this.sendUserScheduleNotification();
              this.openNotificationWebSocketConnection();
            });

          }, (error) => new Error("Can't get user keycloak id: " + error));

          this.oidcSecurityService.getAccessToken().subscribe(token => this.accessToken = token);
        }
      });
  }

  checkUserAccess(...roles: Role[]): boolean {

    if (this.accessToken) {
      const decodedToken = jwtDecode<JwtPayload & { realm_access: userAccess }>(this.accessToken);
      return roles.every(role => decodedToken.realm_access.roles.includes(role));
    } else {
      return false;
    }
  }

  checkUserAccessAndMembership(hackathonId: number, ...roles: Role[]): boolean {

    if (this.accessToken) {
    const currentUserHackathonId = this.user?.currentHackathonId;

    const decodedToken = jwtDecode<JwtPayload & { realm_access: userAccess }>(this.accessToken);
    return roles.every(role => decodedToken.realm_access.roles.includes(role)) &&
      Number(currentUserHackathonId) === Number(hackathonId);
    } else {
      return false;
    }
  }

  refreshToken(): Observable<LoginResponse> {
    return this.oidcSecurityService.forceRefreshSession();
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

  private sendUserScheduleNotification(index = 0): void {

    if (this.user.currentHackathonId && this.checkUserAccess(Role.ORGANIZER) || this.checkUserAccess(Role.MENTOR)) {
      this.getUserSchedule(this.user!.currentHackathonId!).subscribe(schedule => {

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

  private getUserId(): number {
    return UserManager.currentUserFromStorage.id;
  }

  ngOnDestroy(): void {
    this.accessToken = null;
  }
}
