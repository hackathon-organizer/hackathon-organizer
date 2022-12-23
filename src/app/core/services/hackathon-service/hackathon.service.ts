import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, Observable, of} from "rxjs";
import * as dayjs from "dayjs";
import {UserService} from "../user-service/user.service";
import {HackathonRequest, HackathonResponse, HackathonResponsePage} from "../../../hackathon/model/Hackathon";
import {GlobalErrorHandler} from "../error-service/global-error-handler.service";
import {Criteria} from "../../../hackathon/model/Criteria";
import {NGXLogger} from "ngx-logger";
import {TeamResponse} from "../../../team/model/Team";

@Injectable({
  providedIn: 'root'
})
export class HackathonService {

  constructor(private http: HttpClient,
              private logger: NGXLogger,
              private userService: UserService,
              private errorHandler: GlobalErrorHandler) { }

  BASE_URL_WRITE = 'http://localhost:9090/api/v1/write/hackathons';
  BASE_URL_READ = 'http://localhost:9090/api/v1/read/hackathons';

  createHackathon(hackathon: HackathonRequest): Observable<HackathonResponse> {

    hackathon = this.formatAndValidateDate(hackathon);

    return this.http.post<HackathonResponse>(this.BASE_URL_WRITE, hackathon).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getHackathonDetailsById(id: number): Observable<HackathonResponse> {

    return this.http.get<HackathonResponse>(this.BASE_URL_READ + '/' + id).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getAllHackathons(pageNumber: number): Observable<HackathonResponsePage> {

    return this.http.get<HackathonResponsePage>(this.BASE_URL_READ + "?page=" + pageNumber +"&size=10", {
      headers : {'Access-Control-Allow-Origin': "*", 'Access-Control-Allow-Methods': ['GET', 'OPTIONS', 'PUT', 'POST'],
        'Access-Control-Allow-Headers': ['Origin', 'Content-Type', 'X-Auth-Token']}
    }).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  addUserToHackathon(hackathonId: number, userId: number):Observable<void> {

    return this.http.patch<void>(this.BASE_URL_WRITE + '/' + hackathonId + '/participants/' + userId, null).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getHackathonParticipantsIds(hackathonId: number): Observable<number[]> {
    return this.http.get<number[]>("http://localhost:9090/api/v1/read/hackathons/" + hackathonId + "/participants");
  }

  private formatAndValidateDate(hackathon: HackathonRequest): HackathonRequest {

    const startDate = dayjs(hackathon.eventStartDate);
    const endDate = dayjs(hackathon.eventEndDate);

    if (endDate.isBefore(startDate)) {

        this.errorHandler.handleError(new Error("Provide correct hackathon dates"));
    }

    hackathon.eventStartDate = dayjs(hackathon.eventStartDate).format("HH:mm:ss DD-MM-YYYY");
    hackathon.eventEndDate = dayjs(hackathon.eventEndDate).format("HH:mm:ss DD-MM-YYYY");

    return hackathon;
  }

  getHackathonTeamsById(hackathonId: number): Observable<TeamResponse[]> {

    this.logger.info("Returning hackathon id: " + hackathonId +" teams");

    return this.http.get<TeamResponse[]>(this.BASE_URL_READ + '/' + hackathonId + '/teams');
  }

  getHackathonRatingCriteria(hackathonId: number): Observable<Criteria[]> {

    this.logger.info("Returning hackathon id: " + hackathonId +" criteria");

    return this.http.get<Criteria[]>(this.BASE_URL_READ + '/' + hackathonId + '/criteria');
  }

  saveHackathonRatingCriteria(hackathonId: number, criteria: Criteria[]): Observable<void> {

    this.logger.info("Saving hackathon id: " + hackathonId +" criteria", criteria);

    return this.http.post<void>(this.BASE_URL_WRITE + '/' + hackathonId + '/criteria', criteria);
  }

  updateHackathonRatingCriteria(hackathonId: number, criteria: Criteria[]): Observable<void> {

    this.logger.info("Updating hackathon id: " + hackathonId +" criteria", criteria);

    return this.http.put<void>(this.BASE_URL_WRITE + '/' + hackathonId + '/criteria', criteria);
  }

  saveTeamRating(hackathonId: number, criteria: Criteria[]): Observable<void> {

    this.logger.info("Saving hackathon id: " + hackathonId +" team rating criteria", criteria);

    return this.http.patch<void>(this.BASE_URL_WRITE + '/' + hackathonId + '/criteria/answers', criteria);
  }

  deleteCriteria(idToDelete: number): Observable<void> {

    this.logger.info("Deleting criteria with id", idToDelete);

    return this.http.delete<void>(this.BASE_URL_WRITE + '/criteria/' + idToDelete);
  }

  getLeaderboard(hackathonId: number): Observable<TeamResponse[]> {
    this.logger.info("Returning hackathon id: " + hackathonId + " leaderboard");

    return this.http.get<TeamResponse[]>(this.BASE_URL_READ + '/' + hackathonId + '/leaderboard');
  }
}
