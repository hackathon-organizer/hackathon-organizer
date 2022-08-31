import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HoRoutingModule } from './ho-routing.module';
import { MenuComponent } from './core/menu/menu.component';
import { HoComponent } from './ho.component';
import { HackathonProfileComponent } from './hackathon/hackathon-profile/hackathon-profile.component';
import { FooterComponent } from './core/footer/footer.component';
import {HackathonModule} from "./hackathon/hackathon.module";
import {UserModule} from "./user/user.module";
import {initializeKeycloak} from "./init/keycloak-init.factory";
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";
import {HttpClientModule} from "@angular/common/http";

@NgModule({
  declarations: [
    MenuComponent,
    HoComponent,
    HackathonProfileComponent,
    FooterComponent
  ],
    imports: [
        BrowserModule,
        HttpClientModule,
        KeycloakAngularModule,
        HoRoutingModule,
        HackathonModule,
        UserModule
    ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    }
  ],
  bootstrap: [HoComponent]
})
export class HoModule { }
