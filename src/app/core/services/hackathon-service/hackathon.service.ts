import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HackathonRequest} from "../../../hackathon/model/HackathonRequest";
import {catchError, Observable, of} from "rxjs";
import * as dayjs from "dayjs";
import {UserService} from "../user-service/user.service";
import {HackathonDto, HackathonResponse} from "../../../hackathon/model/Hackathon";
import {ToastrService} from "ngx-toastr";
import {GlobalErrorHandler} from "../toast-service/global-error-handler.service";
import {TeamResponse} from "../../../team/model/TeamRequest";

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

  getAllHackathons(pageNumber: number):Observable<HackathonResponse> {

    return this.http.get<HackathonResponse>(this.BASE_URL_READ + "?page=" + pageNumber +"&size=10").pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
  }

  addUserToHackathon(hackathonId: number):Observable<any> {
    const userId = localStorage.getItem("userId");

    return this.http.patch(this.BASE_URL_WRITE + '/' + hackathonId + '/participants/' + userId, null).pipe(
      catchError((error) => this.errorHandler.handleError(error)
      ));
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
