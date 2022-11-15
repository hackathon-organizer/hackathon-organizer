import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HackathonsComponent } from './hackathons/hackathons.component';
import {HackathonRoutingModule} from "./hackathon-routing.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {FlatpickrModule} from "angularx-flatpickr";

@NgModule({
  declarations: [
    HackathonRoutingModule.components
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
        FlatpickrModule
    ]
})
export class HackathonModule { }
