import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, map, Observable} from "rxjs";

import {UserService} from "../user-service/user.service";
import {Tag, TeamResponse, TeamRequest, TeamResponsePage, TeamInvitationRequest} from "../../../team/model/Team";
import {UserManager} from "../../../shared/UserManager";
import {NotificationType} from "../../../user/model/NotificationType";
import {TeamInvitationNotification} from "../../../team/model/Notifications";

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  BASE_URL_READ = 'http://localhost:9090/api/v1/read/teams';
  BASE_URL_WRITE = 'http://localhost:9090/api/v1/write/teams';

  constructor(private http: HttpClient) {

  }

  updateInviteStatus(teamInvite: TeamInvitationNotification, accepted: boolean) {

    if (accepted) {
      teamInvite.invitationStatus = "ACCEPTED";
    } else {
      teamInvite.invitationStatus = "REJECTED";
    }

    const teamId = teamInvite.teamId;
    const invitationRequest = {
      id: teamInvite.id,
      fromUserName: teamInvite.fromUserName,
      invitationStatus: teamInvite.invitationStatus,
      teamName: teamInvite.teamName,
      teamId: teamInvite.teamId
    } as TeamInvitationRequest;

    return this.http.patch('http://localhost:9090/api/v1/write/teams/' + teamId + '/invites', invitationRequest);
  }

  sendTeamInvitation(userId: number, teamId: number, username: string): Observable<any> {

    return this.http.post("http://localhost:9090/api/v1/write/teams/" + teamId + "/invite/" + userId + "?username=" + username, null, {
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  createTeam(team: TeamRequest): Observable<TeamResponse> {
    return this.http.post<TeamResponse>('http://localhost:9090/api/v1/write/teams', team);
  }

  getAvailableTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>('http://localhost:9090/api/v1/read/teams/tags');
  }

  getTeamById(teamId: number): Observable<TeamResponse> {

    return this.http.get<TeamResponse>(this.BASE_URL_READ + '/' + teamId);
  }

  addUserToTeam(teamId: number, userId: number): Observable<any> {
    return this.http.patch(this.BASE_URL_WRITE + '/' + teamId + '/participants/' + userId, null);
  }

  openOrCloseTeamForMembers(teamId: number, teamStatus: any): Observable<boolean> {
    return this.http.patch<boolean>(this.BASE_URL_WRITE + '/' + teamId, teamStatus);
  }

  // isUserTeamOwner(teamId: number, userId: number): Observable<boolean> {
  //   return this.http.get<boolean>(this.BASE_URL_READ + '/' + teamId + '/owners?userId=' + userId);
  // }

  getTeamSuggestions(userTags: Tag[], hackathonId: number): Observable<TeamResponse[]> {

     const userTagsNames = userTags.map(tag => tag.name);

     return this.http.post<TeamResponse[]>(this.BASE_URL_READ + "/suggestions?hackathonId=" + hackathonId, userTagsNames);
  }

  getTeamsByHackathonId(hackathonId: number, pageNumber: number): Observable<TeamResponsePage> {

    return this.http.get<TeamResponsePage>(this.BASE_URL_READ + "?hackathonId=" + hackathonId + "&page=" + pageNumber + "&size=10") ;
      //.pipe(
      // catchError((error) => this.errorHandler.handleError(error)
      // ));
  }

  public fetchUserInvites(currentHackathonId: number) {
    const userId = UserManager.currentUserFromLocalStorage.id;

    return this.http.get<TeamInvitationNotification[]>('http://localhost:9090/api/v1/read/teams/invitations/' + userId + "?hackathonId=" + currentHackathonId);
  }

  searchTeamByName(changedValue: string, hackathonId: number, pageNumber: number): Observable<TeamResponsePage> {

    return this.http.get<TeamResponsePage>(this.BASE_URL_READ + "/search?hackathonId=" + hackathonId + "&name=" + changedValue + "&page=" + pageNumber + "&size=10" );
  }

  updateTeam(team: TeamRequest, teamId: number): Observable<TeamResponse> {
    return this.http.put<TeamResponse>('http://localhost:9090/api/v1/write/teams/' + teamId, team);
  }
}
