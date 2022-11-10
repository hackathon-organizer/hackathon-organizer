import {ErrorHandler, Inject, Injectable, Injector} from '@angular/core';
import {ToastrService} from "ngx-toastr";
import {HttpErrorResponse} from "@angular/common/http";
import {NEVER} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler extends ErrorHandler {

  constructor(@Inject(Injector) private injector: Injector) {
    super();
  }

  private get toastrService(): ToastrService {
    return this.injector.get(ToastrService);
  }

  public override handleError(error: HttpErrorResponse | Error) {
    let errorMessage = '';

    if (error instanceof HttpErrorResponse) {

      if (error.status === 0) {
        errorMessage = 'No connection with server. Please try again later.';
      } else {
        errorMessage = `Server returned code: ${error.status}, error message is: ${error.error.message}`;
      }

    } else {
      errorMessage = error.message;
    }

    this.toastrService.error(errorMessage, "Error");

    return NEVER;
  }
}
