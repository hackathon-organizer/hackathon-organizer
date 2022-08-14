import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HoRoutingModule } from './ho-routing.module';
import { MenuComponent } from './core/menu/menu.component';
import { HoComponent } from './ho.component';

@NgModule({
  declarations: [
    MenuComponent,
    HoComponent
  ],
  imports: [
    BrowserModule,
    HoRoutingModule
  ],
  providers: [],
  bootstrap: [HoComponent]
})
export class HoModule { }
