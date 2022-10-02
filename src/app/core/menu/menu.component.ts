import { Component, OnInit } from '@angular/core';
import {Client} from "@stomp/stompjs";
import {KeycloakService} from "keycloak-angular";

@Component({
  selector: 'ho-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }


}
