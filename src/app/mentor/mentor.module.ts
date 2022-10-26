import {CUSTOM_ELEMENTS_SCHEMA, Injectable, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MentorScheduleComponent} from './mentor-schedule/mentor-schedule.component';
import {MentorRoutingModule} from "./mentor-routing.module";
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarNativeDateFormatter,
  DateAdapter,
  DateFormatterParams
} from 'angular-calendar';
import {adapterFactory} from 'angular-calendar/date-adapters/date-fns';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {FlatpickrModule} from "angularx-flatpickr";

@Injectable({
  providedIn: 'root'
})
export class CustomDateFormatter extends CalendarNativeDateFormatter {

  public override dayViewHour({date, locale}: DateFormatterParams): string {
    // change this to return a different date format

    return new Intl.DateTimeFormat('pl-PL', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
    //return new Intl.DateTimeFormat(locale, {hour: 'numeric'}).format(date);
  }

  public override weekViewHour({ date, locale }: DateFormatterParams): string {
    return new Intl.DateTimeFormat('pl-PL', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  }

}

@NgModule({
  declarations: [
    MentorRoutingModule.components
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  exports: [
    MentorScheduleComponent
  ],
  imports: [
    CommonModule,
    MentorRoutingModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }, {
      dateFormatter: {
        provide: CalendarDateFormatter,
        useClass: CustomDateFormatter
      }
    }),
    FormsModule,
    ReactiveFormsModule,
    FlatpickrModule.forRoot()
  ]        , providers: [
    {provide: CalendarDateFormatter, useClass: CustomDateFormatter}
  ]
})
export class MentorModule {
}


