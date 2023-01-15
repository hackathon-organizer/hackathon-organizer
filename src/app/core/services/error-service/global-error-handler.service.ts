import {ErrorHandler, Inject, Injectable, Injector} from '@angular/core';
import {ToastrService} from "ngx-toastr";
import {HttpErrorResponse} from "@angular/common/http";
import {NEVER} from "rxjs";
import {NGXLogger} from "ngx-logger";

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler extends ErrorHandler {

  constructor(@Inject(Injector) private injector: Injector,
              private logger: NGXLogger) {
    super();
  }

  private get toastrService(): ToastrService {
    return this.injector.get(ToastrService);
  }

  public override handleError(error: HttpErrorResponse | Error) {
    let errorMessage = '';
    this.logger.error(error);
    errorMessage = error.message;
    this.toastrService.error(errorMessage, "Error");
    return NEVER;
  }
}
