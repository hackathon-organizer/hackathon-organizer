import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HackathonRequest} from "../../../hackathon/model/HackathonRequest";
import {Observable} from "rxjs";
import * as dayjs from "dayjs";
import {UserService} from "../user-service/user.service";
import {HackathonDto} from "../../../hackathon/model/Hackathon";
import {Criteria} from "../../../hackathon/model/Criteria";

@Injectable({
  providedIn: 'root'
})
export class HackathonService {

  constructor(private http: HttpClient, private userService: UserService) { }

  BASE_URL_WRITE = 'http://localhost:9090/api/v1/write/hackathons';
  BASE_URL_READ = 'http://localhost:9090/api/v1/read/hackathons';

  createHackathon(hackathon: HackathonRequest): Observable<any> {

    hackathon = this.formatDate(hackathon);

    return this.http.post(this.BASE_URL_WRITE, hackathon);
  }

  getHackathonDetailsById(id: number): Observable<any> {
    return this.http.get(this.BASE_URL_READ + '/' + id);
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

    return this.http.patch(this.BASE_URL_WRITE + '/' + hackathonId + '/participants/' + userId, null);
  }

  getHackathonTeamsById(hackathonId: number): Observable<any> {
    return this.http.get(this.BASE_URL_READ + '/' + hackathonId + '/teams');
  }

  getHackathonRatingCriteria(hackathonId: number): Observable<Criteria[]> {
    return this.http.get<Criteria[]>(this.BASE_URL_READ + '/' + hackathonId + '/criteria');
  }
}
