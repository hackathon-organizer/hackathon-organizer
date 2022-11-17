import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, map, Observable} from "rxjs";
import {TeamInvitation} from "../../../team/model/TeamInvitation";
import {InvitationDto} from "../../../team/model/InvitationDto";
import {UserService} from "../user-service/user.service";
import {Tag, Team, TeamRequest, TeamResponse} from "../../../team/model/TeamRequest";

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  BASE_URL_READ = 'http://localhost:9090/api/v1/read/teams';
  BASE_URL_WRITE = 'http://localhost:9090/api/v1/write/teams';

  constructor(private http: HttpClient) {

  }

  updateInviteStatus(teamInvite: TeamInvitation, accepted: boolean) {

    if (accepted) {
      teamInvite.invitationStatus = "ACCEPTED";

      // TODO remove inv from array
    } else {
      teamInvite.invitationStatus = "REJECTED";
    }

    const teamId = teamInvite.teamId;

    console.log("sendingPost...")
    console.log(teamInvite);

    const x = new InvitationDto(teamInvite.id, teamInvite.fromUserName, teamInvite.invitationStatus, teamInvite.teamName, teamInvite.teamId);

    this.http.patch('http://localhost:9090/api/v1/write/teams/' + teamId + '/invites', x).subscribe();
  }

  sendTeamInvitation(userId: number, teamId: number, username: string): Observable<any> {

    return this.http.post("http://localhost:9090/api/v1/write/teams/" + teamId + "/invite/" + userId + "?username=" + username, null, {
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  createTeam(team: TeamRequest): Observable<Team> {
    return this.http.post<Team>('http://localhost:9090/api/v1/write/teams', team);
  }

  getAvailableTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>('http://localhost:9090/api/v1/read/teams/tags');
  }

  getTeamById(teamId: number): Observable<Team> {

    return this.http.get<Team>(this.BASE_URL_READ + '/' + teamId);
  }

  addUserToTeam(teamId: number, userId: number): Observable<any> {
    return this.http.patch(this.BASE_URL_WRITE + '/' + teamId + '/participants/' + userId, null);
  }

  openOrCloseTeamForMembers(teamId: number, isOpen: boolean): Observable<boolean> {
    return this.http.patch<boolean>(this.BASE_URL_WRITE + '/' + teamId, isOpen);
  }

  isUserTeamOwner(teamId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(this.BASE_URL_READ + '/' + teamId + '/owners?userId=' + userId);
  }

  getTeamSuggestions(userTags: Tag[], hackathonId: number): Observable<Team[]> {
     return this.http.post<Team[]>(this.BASE_URL_READ + "/suggestions?hackathonId=" + hackathonId, userTags);
  }

  getTeamsByHackathonId(hackathonId: number, pageNumber: number): Observable<TeamResponse> {

    return this.http.get<TeamResponse>(this.BASE_URL_READ + "?hackathonId=" + hackathonId + "&page=" + pageNumber + "&size=10") ;
      //.pipe(
      // catchError((error) => this.errorHandler.handleError(error)
      // ));
  }
}
