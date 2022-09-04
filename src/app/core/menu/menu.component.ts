import { Component, OnInit } from '@angular/core';
import {Client} from "@stomp/stompjs";
import {KeycloakService} from "keycloak-angular";

@Component({
  selector: 'ho-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {


  // TODO find a better place to open ws connection


  constructor() {
  }

  ngOnInit(): void {
  }


}
