import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HackathonsComponent } from './hackathons/hackathons.component';
import {HackathonRoutingModule} from "./hackathon-routing.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {FlatpickrModule} from "angularx-flatpickr";
import {NgxPaginationModule} from "ngx-pagination";
import {SharedModule} from "../shared/shared.module";
import { LeaderboardComponent } from './leaderboard/leaderboard.component';

@NgModule({
  declarations: [
    HackathonRoutingModule.components,
    LeaderboardComponent,
  ],
  exports: [
    HackathonsComponent,
    HackathonRoutingModule
  ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        FlatpickrModule,
        NgxPaginationModule,
        SharedModule
    ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HackathonModule { }
