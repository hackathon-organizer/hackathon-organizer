import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HackathonRequest} from "../../../hackathon/model/HackathonRequest";
import {Observable} from "rxjs";
import * as dayjs from "dayjs";
import {UserService} from "../user-service/user.service";
import {HackathonDto} from "../../../hackathon/model/Hackathon";
import {Criteria, CriteriaAnswer} from "../../../hackathon/model/Criteria";
import {NGXLogger} from "ngx-logger";

@Injectable({
  providedIn: 'root'
})
export class HackathonService {

  constructor(private http: HttpClient, private userService: UserService, private logger: NGXLogger) { }

  BASE_URL_WRITE = 'http://localhost:9090/api/v1/write/hackathons';
  BASE_URL_READ = 'http://localhost:9090/api/v1/read/hackathons';

  saveHackathon(hackathon: HackathonRequest): Observable<any> {

    hackathon = this.formatDate(hackathon);

    this.logger.info("Saving new hackathon", hackathon);

    return this.http.post(this.BASE_URL_WRITE, hackathon);
  }

  getHackathonDetailsById(hackathonId: number): Observable<any> {

    this.logger.info("Returning hackathon id: " + hackathonId +" details");

    return this.http.get(this.BASE_URL_READ + '/' + hackathonId);
  }

  getAllHackathons():Observable<HackathonDto[]> {

    return this.http.get<HackathonDto[]>(this.BASE_URL_READ);
  }

  private formatDate(hackathon: HackathonRequest): HackathonRequest {

    hackathon.eventStartDate = dayjs(hackathon.eventStartDate).format("HH:mm:ss DD-MM-YYYY");
    hackathon.eventEndDate = dayjs(hackathon.eventEndDate).format("HH:mm:ss DD-MM-YYYY");

    return hackathon;
  }

  addUserToHackathon(hackathonId: number):Observable<any> {
    const userId = this.userService.getUserId();

    this.logger.info("Adding user to hackathon id: " + hackathonId);

    return this.http.patch(this.BASE_URL_WRITE + '/' + hackathonId + '/participants/' + userId, null);
  }

  getHackathonTeamsById(hackathonId: number): Observable<any> {

    this.logger.info("Returning hackathon id: " + hackathonId +" teams");

    return this.http.get(this.BASE_URL_READ + '/' + hackathonId + '/teams');
  }

  getHackathonRatingCriteria(hackathonId: number): Observable<Criteria[]> {

    this.logger.info("Returning hackathon id: " + hackathonId +" criteria");

    return this.http.get<Criteria[]>(this.BASE_URL_READ + '/' + hackathonId + '/criteria');
  }

  saveHackathonRatingCriteria(hackathonId: number, criteria: Criteria[]): Observable<any> {

    this.logger.info("Saving hackathon id: " + hackathonId +" criteria", criteria);

    return this.http.post(this.BASE_URL_WRITE + '/' + hackathonId + '/criteria', criteria);
  }

  saveTeamRating(hackathonId: number, criteria: Criteria[]): Observable<any> {

    this.logger.info("Saving hackathon id: " + hackathonId +" team rating criteria", criteria);

    return this.http.patch(this.BASE_URL_WRITE + '/' + hackathonId + '/criteria', criteria);
  }
}
