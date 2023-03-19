import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import * as dayjs from "dayjs";
import {UserService} from "../user-service/user.service";
import {HackathonRequest, HackathonResponse, HackathonResponsePage} from "../../../hackathon/model/Hackathon";
import {GlobalErrorHandler} from "../error-service/global-error-handler.service";
import {Criteria, CriteriaAnswer} from "../../../hackathon/model/Criteria";
import {NGXLogger} from "ngx-logger";
import {TeamResponse} from "../../../team/model/Team";
import {environment} from "../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class HackathonService {

  private BASE_URL_UPDATE = environment.API_URL + '/api/v1/write/hackathons/';
  private BASE_URL_READ = environment.API_URL + '/api/v1/read/hackathons/';

  constructor(private http: HttpClient,
              private logger: NGXLogger,
              private userService: UserService,
              private errorHandler: GlobalErrorHandler) {
  }

  createHackathon(hackathon: HackathonRequest): Observable<HackathonResponse> {

    console.log(hackathon)

    //hackathon = this.formatAndValidateDate(hackathon);
    return this.http.post<HackathonResponse>(this.BASE_URL_UPDATE.slice(0, -1), hackathon);
  }

  getHackathonDetailsById(id: number): Observable<HackathonResponse> {
    return this.http.get<HackathonResponse>(this.BASE_URL_READ + id);
  }

  getAllHackathons(pageNumber: number): Observable<HackathonResponsePage> {

    return this.http.get<HackathonResponsePage>(this.BASE_URL_READ.slice(0, -1),
      {
        params: {
          page: pageNumber,
          size: 10
        }
      });
  }

  addUserToHackathon(hackathonId: number, userId: number): Observable<void> {
    return this.http.patch<void>(this.BASE_URL_UPDATE + hackathonId + '/participants/' + userId, null);
  }

  getHackathonParticipantsIds(hackathonId: number): Observable<number[]> {
    return this.http.get<number[]>(this.BASE_URL_READ + hackathonId + "/participants");
  }

  getHackathonTeamsById(hackathonId: number): Observable<TeamResponse[]> {
    return this.http.get<TeamResponse[]>(this.BASE_URL_READ + hackathonId + '/teams');
  }

  getHackathonRatingCriteriaAnswers(hackathonId: number, userId: number): Observable<CriteriaAnswer[]> {
    return this.http.get<CriteriaAnswer[]>(this.BASE_URL_READ + hackathonId + '/criteria/answers',
      {params: {userId: userId}});
  }

  getHackathonRatingCriteria(hackathonId: number): Observable<Criteria[]> {
    return this.http.get<Criteria[]>(this.BASE_URL_READ + hackathonId + '/criteria');
  }

  saveHackathonRatingCriteria(hackathonId: number, criteria: Criteria[]): Observable<Criteria[]> {
    return this.http.post<Criteria[]>(this.BASE_URL_UPDATE + hackathonId + '/criteria', criteria);
  }

  updateHackathonRatingCriteria(hackathonId: number, criteria: Criteria[]): Observable<void> {
    return this.http.put<void>(this.BASE_URL_UPDATE + hackathonId + '/criteria', criteria);
  }

  saveTeamRating(hackathonId: number, criteria: CriteriaAnswer[]): Observable<CriteriaAnswer[]> {
    return this.http.patch<CriteriaAnswer[]>(this.BASE_URL_UPDATE + hackathonId + '/criteria/answers', criteria);
  }

  deleteCriteria(hackathonId: number, idToDelete: number): Observable<void> {
    return this.http.delete<void>(this.BASE_URL_UPDATE + hackathonId + '/criteria/' + idToDelete);
  }

  getLeaderboard(hackathonId: number): Observable<TeamResponse[]> {
    return this.http.get<TeamResponse[]>(this.BASE_URL_READ + hackathonId + '/leaderboard');
  }

  uploadFile(file: File, hackathonId: number) {
    return this.http.post(this.BASE_URL_UPDATE + hackathonId + '/files/logos', file,  {
      reportProgress: true,
      observe: 'events'
    });
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
}
