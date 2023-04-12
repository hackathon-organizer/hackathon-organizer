import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HoRoutingModule} from './ho-routing.module';
import {HoComponent} from './ho.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {LoggerModule, NgxLoggerLevel} from "ngx-logger";
import {CustomDateFormatter} from "./mentor/mentor.module";
import {CalendarDateFormatter, CalendarModule, DateAdapter} from 'angular-calendar';
import {adapterFactory} from "angular-calendar/date-adapters/date-fns";
import {FlatpickrModule} from "angularx-flatpickr";
import {ToastrModule} from "ngx-toastr";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ApiInterceptor} from "./core/interceptors/api.interceptor";
import {AuthInterceptor, AuthModule, LogLevel} from "angular-auth-oidc-client";
import {environment} from "../environments/environment.prod";

@NgModule({
  declarations: [
    HoRoutingModule.components
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    HoRoutingModule,
    LoggerModule.forRoot({
      serverLoggingUrl: '/api/logs',
      level: NgxLoggerLevel.DEBUG,
      serverLogLevel: NgxLoggerLevel.ERROR
    }),
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }, {
      dateFormatter: {
        provide: CalendarDateFormatter,
        useClass: CustomDateFormatter
      }
    }),
    FlatpickrModule.forRoot(),
    ToastrModule.forRoot(),
    AuthModule.forRoot({
      config: {
        authority: environment.KEYCLOAK_URL + 'realms/hackathon-organizer',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'hackathon-organizer-client',
        scope: 'openid profile email offline_access',
        responseType: 'code',
        renewTimeBeforeTokenExpiresInSeconds: 10,
        silentRenew: true,
        useRefreshToken: true,
        logLevel: LogLevel.Debug,
      },
    }),
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useClass: ApiInterceptor
    }
  ],
  bootstrap: [HoComponent]
})
export class HoModule {
}
