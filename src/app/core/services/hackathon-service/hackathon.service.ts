import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HackathonRequest} from "../../../hackathon/model/HackathonRequest";
import {catchError, Observable, of} from "rxjs";
import * as dayjs from "dayjs";
import {UserService} from "../user-service/user.service";
import {HackathonDto} from "../../../hackathon/model/Hackathon";
import {ToastrService} from "ngx-toastr";
import {GlobalErrorHandler} from "../toast-service/global-error-handler.service";

@Injectable({
  providedIn: 'root'
})
export class HackathonService {

  constructor(private http: HttpClient, private userService: UserService, private errorHandler: GlobalErrorHandler) { }

  BASE_URL_WRITE = 'http://localhost:9090/api/v1/write/hackathons';
  BASE_URL_READ = 'http://localhost:9090/api/v1/read/hackathons';

  createHackathon(hackathon: HackathonRequest): Observable<any> {

    hackathon = this.formatDate(hackathon);

    return this.http.post(this.BASE_URL_WRITE, hackathon).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getHackathonDetailsById(id: number): Observable<any> {
    return this.http.get(this.BASE_URL_READ + '/' + id).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getAllHackathons():Observable<HackathonDto[]> {

    return this.http.get<HackathonDto[]>(this.BASE_URL_READ).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  addUserToHackathon(hackathonId: number):Observable<any> {
    const userId = this.userService.getUserId();

    return this.http.patch(this.BASE_URL_WRITE + '/' + hackathonId + '/participants/' + userId, null).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  getHackathonTeamsById(hackathonId: number): Observable<any> {
    return this.http.get(this.BASE_URL_READ + '/' + hackathonId + '/teams').pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  private formatDate(hackathon: HackathonRequest): HackathonRequest {

    hackathon.eventStartDate = dayjs(hackathon.eventStartDate).format("HH:mm:ss DD-MM-YYYY");
    hackathon.eventEndDate = dayjs(hackathon.eventEndDate).format("HH:mm:ss DD-MM-YYYY");

    return hackathon;
  }
}
