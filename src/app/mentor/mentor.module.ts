import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MentorScheduleComponent } from './mentor-schedule/mentor-schedule.component';
import {MentorRoutingModule} from "./mentor-routing.module";
import {CalendarModule, DateAdapter} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {FlatpickrModule} from "angularx-flatpickr";
import { HackathonRatingFormComponent } from '../hackathon/hackathon-rating-form/hackathon-rating-form.component';



@NgModule({
    declarations: [
      MentorRoutingModule.components
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
      }),
      FormsModule,
      ReactiveFormsModule,
      FlatpickrModule.forRoot()
    ]
})
export class MentorModule { }
