import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamProfileComponent } from './team-profile/team-profile.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";
import {TeamRoutingModule} from "./team-routing.module";
import {Router, RouterModule} from "@angular/router";
import { NewTeamFormComponent } from './new-team-form/new-team-form.component';



@NgModule({
    declarations: [
        TeamRoutingModule.components
    ],
    exports: [
        TeamProfileComponent,
        TeamRoutingModule
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        RouterModule,
    ]
})
export class TeamModule { }
