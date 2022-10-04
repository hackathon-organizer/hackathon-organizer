import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {TeamInvitation} from "../../../team/model/TeamInvitation";
import {InvitationDto} from "../../../team/model/InvitationDto";
import {UserService} from "../user-service/user.service";
import {Tag, TeamRequest, TeamResponse} from "../../../team/model/TeamRequest";

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  constructor(private http: HttpClient, private userService: UserService) { }

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


  sendTeamInvitation(userId: number, teamId: number): Observable<any> {

    const username = this.userService.getUsername();

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
}
