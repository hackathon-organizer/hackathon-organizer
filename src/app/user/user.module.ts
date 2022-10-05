import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileComponent } from './user-profile/user-profile.component';
import {RouterModule} from "@angular/router";
import {UserRoutingModule} from "./user-routing.module";



@NgModule({
    declarations: [
        UserRoutingModule.components
    ],
    exports: [
        UserProfileComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        UserRoutingModule
    ]
})
export class UserModule { }
