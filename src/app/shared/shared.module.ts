import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSerachComponent } from './user-serach/user-serach.component';
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {ToastrModule} from "ngx-toastr";
import { PaginationComponent } from './pagination/pagination.component';
import {NgxPaginationModule} from "ngx-pagination";



@NgModule({
  declarations: [
    UserSerachComponent,
    PaginationComponent
  ],
  exports: [
    PaginationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgxPaginationModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule { }
