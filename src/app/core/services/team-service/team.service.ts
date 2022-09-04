import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {TeamInvitation} from "../../../team/model/TeamInvitation";

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  constructor(private http: HttpClient) { }

  acceptTeamInivitation() {

  }

  sendInv(userKeycloakId: string): Observable<any> {
    const teamInv = new TeamInvitation(12, 12, "PENDING", "XXX");

    return this.http.post("http://localhost:9090/teams/1/invite/" + userKeycloakId, teamInv);
  }
}
