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

  BASE_URL_WRITE = 'http://localhost:9090/api/v1/write/hackathons';
  BASE_URL_READ = 'http://localhost:9090/api/v1/read/hackathons';

  createHackathon(hackathon: HackathonRequest): Observable<any> {

    hackathon = this.formatDate(hackathon);

    return this.http.post(this.BASE_URL_WRITE, hackathon);
  }

  getHackathonDetailsById(id: number): Observable<any> {
    return this.http.get(this.BASE_URL_READ + '/' + id);
  }

  getAllHackathons():Observable<any> {
    console.log("sending req")

    return this.http.get(this.BASE_URL_READ);
  }

  private formatDate(hackathon: HackathonRequest): HackathonRequest {

    hackathon.eventStartDate = dayjs(hackathon.eventStartDate).format("HH:mm:ss DD-MM-YYYY");
    hackathon.eventEndDate = dayjs(hackathon.eventEndDate).format("HH:mm:ss DD-MM-YYYY");

    return hackathon;
  }
}
