import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Tag, TeamInvitationRequest, TeamRequest, TeamResponse, TeamResponsePage} from "../../../team/model/Team";
import {UserManager} from "../../../shared/UserManager";
import {TeamInvitationNotification} from "../../../team/model/Notifications";

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  BASE_URL_READ = 'http://localhost:9090/api/v1/read/teams/';
  BASE_URL_UPDATE = 'http://localhost:9090/api/v1/write/teams/';

  constructor(private http: HttpClient) {
  }

  updateInvitationStatus(teamInvitationNotification: TeamInvitationNotification, accepted: boolean) {

    if (accepted) {
      teamInvitationNotification.invitationStatus = "ACCEPTED";
    } else {
      teamInvitationNotification.invitationStatus = "REJECTED";
    }

    const teamId = teamInvitationNotification.teamId;
    const invitationRequest = {
      id: teamInvitationNotification.id,
      fromUserName: teamInvitationNotification.fromUserName,
      invitationStatus: teamInvitationNotification.invitationStatus,
      teamName: teamInvitationNotification.teamName,
      teamId: teamId
    } as TeamInvitationRequest;

    return this.http.patch(this.BASE_URL_UPDATE + teamId + '/invitations', invitationRequest);
  }

  sendTeamInvitation(userId: number, teamId: number, username: string): Observable<any> {

    return this.http.post(this.BASE_URL_UPDATE + teamId + "/invitations", userId, {
      params: {
        username: username
      }
    });
  }

  createTeam(team: TeamRequest): Observable<TeamResponse> {

    return this.http.post<TeamResponse>('http://localhost:9090/api/v1/write/teams', team);
  }

  getTags(): Observable<Tag[]> {

    return this.http.get<Tag[]>(this.BASE_URL_READ + "tags");
  }

  getTeamById(teamId: number): Observable<TeamResponse> {

    return this.http.get<TeamResponse>(this.BASE_URL_READ + teamId);
  }

  addUserToTeam(teamId: number, userId: number): Observable<any> {

    return this.http.patch(this.BASE_URL_UPDATE + teamId + '/participants/' + userId, null);
  }

  openOrCloseTeamForMembers(teamId: number, teamStatus: any): Observable<boolean> {

    return this.http.patch<boolean>(this.BASE_URL_UPDATE + teamId, teamStatus);
  }

  getTeamSuggestions(userTags: Tag[], hackathonId: number): Observable<TeamResponse[]> {

    const userTagsNames = userTags.map(tag => tag.name);

    return this.http.post<TeamResponse[]>(this.BASE_URL_READ + "suggestions", userTagsNames, {
      params: {
        hackathonId: hackathonId
      }
    });
  }

  getTeamsByHackathonId(hackathonId: number, pageNumber: number): Observable<TeamResponsePage> {

    return this.http.get<TeamResponsePage>(this.BASE_URL_READ.slice(0, -1), {
      params: {
        hackathonId: hackathonId,
        page: pageNumber,
        size: 10
      }
    });
  }

  public fetchUserInvites(hackathonId: number) {
    const userId = UserManager.currentUserFromStorage.id;

    return this.http.get<TeamInvitationNotification[]>('http://localhost:9090/api/v1/read/teams/invitations/' + userId, {
      params: {
        hackathonId: hackathonId
      }
    });
  }

  searchTeamByName(name: string, hackathonId: number, pageNumber: number): Observable<TeamResponsePage> {

    return this.http.get<TeamResponsePage>(this.BASE_URL_READ + "search", {
      params: {
        hackathonId: hackathonId,
        name: name,
        page: pageNumber,
        size: 10
      }
    });
  }

  updateTeam(team: TeamRequest, teamId: number): Observable<TeamResponse> {
    return this.http.put<TeamResponse>('http://localhost:9090/api/v1/write/teams/' + teamId, team);
  }
}
