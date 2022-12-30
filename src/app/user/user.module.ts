import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserProfileComponent} from './user-profile/user-profile.component';
import {RouterModule} from "@angular/router";
import {UserRoutingModule} from "./user-routing.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";


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
    UserRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class UserModule {
}
