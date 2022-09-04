import { Component, OnInit } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import {KeycloakService} from "keycloak-angular";

@Component({
  selector: 'ho-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

}
