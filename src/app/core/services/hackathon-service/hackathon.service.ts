import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HackathonRequest} from "../../../hackathon/model/HackathonRequest";
import {Observable} from "rxjs";
import * as dayjs from "dayjs";

@Injectable({
  providedIn: 'root'
})
export class HackathonService {

  constructor(private http: HttpClient) { }

  BASE_URL = 'http://localhost:9090/api/v1/write/hackathons';

  createHackathon(hackathon: HackathonRequest): Observable<any> {

    hackathon = this.formatDate(hackathon);

    return this.http.post(this.BASE_URL, hackathon);
  }

  private formatDate(hackathon: HackathonRequest): HackathonRequest {

    hackathon.eventStartDate = dayjs(hackathon.eventStartDate).format("HH:mm:ss DD-MM-YYYY");
    hackathon.eventEndDate = dayjs(hackathon.eventEndDate).format("HH:mm:ss DD-MM-YYYY");

    return hackathon;
  }
}
