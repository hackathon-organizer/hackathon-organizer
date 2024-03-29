import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HackathonRoutingModule} from "./hackathon-routing.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {FlatpickrModule} from "angularx-flatpickr";
import {NgxPaginationModule} from "ngx-pagination";
import {SharedModule} from "../shared/shared.module";

@NgModule({
  declarations: [
    HackathonRoutingModule.components,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    FlatpickrModule,
    NgxPaginationModule,
    SharedModule,
    HackathonRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HackathonModule {
}
