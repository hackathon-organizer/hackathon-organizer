import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {HoRoutingModule} from './ho-routing.module';
import {MenuComponent} from './core/menu/menu.component';
import {HoComponent} from './ho.component';
import {FooterComponent} from './core/footer/footer.component';
import {HackathonModule} from "./hackathon/hackathon.module";
import {UserModule} from "./user/user.module";
import {initializeKeycloak} from "./init/keycloak-init.factory";
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";
import {HttpClientModule} from "@angular/common/http";
import {TeamModule} from "./team/team.module";
import {HomepageComponent} from './core/homepage/homepage.component';
import {LoggerModule, NgxLoggerLevel} from "ngx-logger";
import {CustomDateFormatter, MentorModule} from "./mentor/mentor.module";
import {CalendarDateFormatter, CalendarModule, DateAdapter} from 'angular-calendar';
import {adapterFactory} from "angular-calendar/date-adapters/date-fns";


@NgModule({
  declarations: [
    MenuComponent,
    HoComponent,
    FooterComponent,
    HomepageComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    KeycloakAngularModule,
    HoRoutingModule,
    TeamModule,
    HackathonModule,
    UserModule,
    MentorModule,
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
    })
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },
  ],
  bootstrap: [HoComponent]
})
export class HoModule {
}
