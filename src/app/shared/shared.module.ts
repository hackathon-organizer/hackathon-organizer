import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSerachComponent } from './user-serach/user-serach.component';
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";



@NgModule({
  declarations: [
    UserSerachComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class SharedModule { }
