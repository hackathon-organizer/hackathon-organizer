import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  findUserByUsername(username: string): Observable<any> {
     return this.http.get('http://localhost:9090/users?username=' + username);
  }
}
