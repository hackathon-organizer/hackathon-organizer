import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, Observable} from "rxjs";
import * as dayjs from "dayjs";
import {UserService} from "../user-service/user.service";
import {HackathonRequest, HackathonResponse, HackathonResponsePage} from "../../../hackathon/model/Hackathon";
import {GlobalErrorHandler} from "../error-service/global-error-handler.service";
import {Criteria, CriteriaAnswer} from "../../../hackathon/model/Criteria";
import {NGXLogger} from "ngx-logger";
import {TeamResponse} from "../../../team/model/Team";

@Injectable({
  providedIn: 'root'
})
export class HackathonService {

  constructor(private http: HttpClient,
              private logger: NGXLogger,
              private userService: UserService,
              private errorHandler: GlobalErrorHandler) {
  }

  BASE_URL_UPDATE = 'http://localhost:9090/api/v1/write/hackathons/';
  BASE_URL_READ = 'http://localhost:9090/api/v1/read/hackathons/';

  createHackathon(hackathon: HackathonRequest): Observable<HackathonResponse> {

    hackathon = this.formatAndValidateDate(hackathon);

    return this.http.post<HackathonResponse>(this.BASE_URL_UPDATE, hackathon);
  }

  getHackathonDetailsById(id: number): Observable<HackathonResponse> {

    return this.http.get<HackathonResponse>(this.BASE_URL_READ + id);
  }

  getAllHackathons(pageNumber: number): Observable<HackathonResponsePage> {

    return this.http.get<HackathonResponsePage>(this.BASE_URL_READ,
      {
        params: {
          page: pageNumber,
          size: 10
        }
      });
  }

  addUserToHackathon(hackathonId: number, userId: number): Observable<void> {

    return this.http.patch<void>(this.BASE_URL_UPDATE + hackathonId + '/participants/' + userId, null)
      ;
  }

  getHackathonParticipantsIds(hackathonId: number): Observable<number[]> {
    return this.http.get<number[]>(this.BASE_URL_READ + hackathonId + "/participants")
      ;
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

    this.logger.info("Returning hackathon id: " + hackathonId + " teams");
    return this.http.get<TeamResponse[]>(this.BASE_URL_READ + hackathonId + '/teams');;
  }

  getHackathonRatingCriteriaAnswers(hackathonId: number, userId: number): Observable<CriteriaAnswer[]> {

    this.logger.info("Returning hackathon id: " + hackathonId + " criteria");
    return this.http.get<CriteriaAnswer[]>(this.BASE_URL_READ + hackathonId + '/criteria/answers',
      {params: {userId: userId}});
  }

  getHackathonRatingCriteria(hackathonId: number): Observable<Criteria[]> {

    this.logger.info("Returning hackathon id: " + hackathonId + " criteria");
    return this.http.get<Criteria[]>(this.BASE_URL_READ + hackathonId + '/criteria');
  }

  saveHackathonRatingCriteria(hackathonId: number, criteria: Criteria[]): Observable<void> {

    this.logger.info("Saving hackathon id: " + hackathonId + " criteria", criteria);
    return this.http.post<void>(this.BASE_URL_UPDATE + hackathonId + '/criteria', criteria);
  }

  updateHackathonRatingCriteria(hackathonId: number, criteria: Criteria[]): Observable<void> {

    this.logger.info("Updating hackathon id: " + hackathonId + " criteria", criteria);
    return this.http.put<void>(this.BASE_URL_UPDATE + hackathonId + '/criteria', criteria);
  }

  saveTeamRating(hackathonId: number, criteria: CriteriaAnswer[]): Observable<CriteriaAnswer[]> {

    this.logger.info("Saving hackathon id: " + hackathonId + " team rating criteria", criteria);
    return this.http.patch<CriteriaAnswer[]>(this.BASE_URL_UPDATE + hackathonId + '/criteria/answers', criteria)
      ;
  }

  deleteCriteria(idToDelete: number): Observable<void> {

    this.logger.info("Deleting criteria with id", idToDelete);
    return this.http.delete<void>(this.BASE_URL_UPDATE + 'criteria/' + idToDelete);
  }

  getLeaderboard(hackathonId: number): Observable<TeamResponse[]> {
    this.logger.info("Returning hackathon id: " + hackathonId + " leaderboard");
    return this.http.get<TeamResponse[]>(this.BASE_URL_READ + hackathonId + '/leaderboard');
  }
}
