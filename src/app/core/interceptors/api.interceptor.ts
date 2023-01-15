import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {ToastrService} from "ngx-toastr";
import {NGXLogger} from "ngx-logger";

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(private toastr: ToastrService,
              private logger: NGXLogger) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
    return next.handle(req).pipe(
      catchError((error) => {
        this.logger.error(error);
        this.toastr.error(error.message, "Error");
        return throwError(error.message);
      })
    )
  }
}
