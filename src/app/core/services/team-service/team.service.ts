import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {TeamInvitation} from "../../../team/model/TeamInvitation";
import {logExperimentalWarnings} from "@angular-devkit/build-angular/src/builders/browser-esbuild/experimental-warnings";

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  constructor(private http: HttpClient) { }

  acceptTeamInivitation() {

  }


  sendTeamInvitation(userKeyCloakId: string, teamId: number): Observable<any> {

    return this.http.post("http://localhost:9090/teams/" + teamId + "/invite/" + userKeyCloakId, "null", {
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
