import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HackathonsComponent } from './hackathons/hackathons.component';




@NgModule({
  declarations: [
    HackathonsComponent
  ],
  exports: [
    HackathonsComponent
  ],
  imports: [
    CommonModule
  ]
})
export class HackathonModule { }
