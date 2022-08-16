import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HoRoutingModule } from './ho-routing.module';
import { MenuComponent } from './core/menu/menu.component';
import { HoComponent } from './ho.component';
import { HackathonProfileComponent } from './hackathon/hackathon-profile/hackathon-profile.component';
import { FooterComponent } from './core/footer/footer.component';

@NgModule({
  declarations: [
    MenuComponent,
    HoComponent,
    HackathonProfileComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    HoRoutingModule
  ],
  providers: [],
  bootstrap: [HoComponent]
})
export class HoModule { }
