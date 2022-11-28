import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HackathonRequest} from "../../../hackathon/model/HackathonRequest";
import {catchError, Observable, of} from "rxjs";
import * as dayjs from "dayjs";
import {UserService} from "../user-service/user.service";
import {HackathonDto, HackathonResponsePage} from "../../../hackathon/model/Hackathon";
import {ToastrService} from "ngx-toastr";
import {GlobalErrorHandler} from "../error-service/global-error-handler.service";
import {TeamResponsePage} from "../../../team/model/TeamRequest";
import {UserResponseDto} from "../../../user/model/UserResponseDto";

@Injectable({
  providedIn: 'root'
})
export class HackathonService {

  constructor(private http: HttpClient, private userService: UserService, private errorHandler: GlobalErrorHandler) { }

  BASE_URL_WRITE = 'http://localhost:9090/api/v1/write/hackathons';
  BASE_URL_READ = 'http://localhost:9090/api/v1/read/hackathons';

  createHackathon(hackathon: HackathonRequest): Observable<any> {

    hackathon = this.formatAndValidateDate(hackathon);

    return this.http.post(this.BASE_URL_WRITE, hackathon).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getHackathonDetailsById(id: number): Observable<HackathonDto> {

    return this.http.get<HackathonDto>(this.BASE_URL_READ + '/' + id).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getAllHackathons(pageNumber: number):Observable<HackathonResponsePage> {

    return this.http.get<HackathonResponsePage>(this.BASE_URL_READ + "?page=" + pageNumber +"&size=10", {
      headers : {'Access-Control-Allow-Origin': "*", 'Access-Control-Allow-Methods': ['GET', 'OPTIONS', 'PUT', 'POST'],
        'Access-Control-Allow-Headers': ['Origin', 'Content-Type', 'X-Auth-Token']}
    }).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  addUserToHackathon(hackathonId: number, userId: number):Observable<any> {

    return this.http.patch(this.BASE_URL_WRITE + '/' + hackathonId + '/participants/' + userId, null).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getHackathonParticipantsIds(hackathonId: number): Observable<number[]> {
    return this.http.get<number[]>("http://localhost:9090/api/v1/read/hackathons/" + hackathonId + "/participants");
  }

  private formatAndValidateDate(hackathon: HackathonRequest): HackathonRequest {

    const startDate = dayjs(hackathon.eventStartDate);
    const endDate = dayjs(hackathon.eventEndDate);

    if (startDate.isBefore(endDate) || startDate.isAfter(endDate)) {

        this.errorHandler.handleError(new Error("Provide correct hackathon dates"));
    }

    hackathon.eventStartDate = dayjs(hackathon.eventStartDate).format("HH:mm:ss DD-MM-YYYY");
    hackathon.eventEndDate = dayjs(hackathon.eventEndDate).format("HH:mm:ss DD-MM-YYYY");

    return hackathon;
  }
}
