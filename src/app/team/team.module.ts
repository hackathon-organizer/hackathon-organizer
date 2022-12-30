import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TeamProfileComponent} from './team-profile/team-profile.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";
import {TeamRoutingModule} from "./team-routing.module";
import {RouterModule} from "@angular/router";
import {TeamChatComponent} from './team-chat/team-chat.component';
import {NgxPaginationModule} from "ngx-pagination";
import {OpenViduAngularConfig} from "openvidu-angular";
import {environment} from "../../environments/environment.prod";


const config: OpenViduAngularConfig = {
  production: environment.production
};

@NgModule({
  declarations: [
    TeamRoutingModule.components,
  ],
  exports: [
    TeamProfileComponent,
    TeamRoutingModule,
    TeamChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule,
    NgxPaginationModule,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class TeamModule {
}
