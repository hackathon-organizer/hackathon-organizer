import { Component, OnInit } from '@angular/core';
import {UserService} from "../../core/services/user-service/user.service";
import {Client} from "@stomp/stompjs";
import {KeycloakService} from "keycloak-angular";
import {TeamService} from "../../core/services/team-service/team.service";

@Component({
  selector: 'ho-team-profile',
  templateUrl: './team-profile.component.html',
  styleUrls: ['./team-profile.component.scss']
})
export class TeamProfileComponent implements OnInit {

  searchUser: string = "";

  constructor(private userService: UserService, private keycloakService: KeycloakService, private teamService: TeamService) { }

  async getKeycloakUserId(): Promise<string | undefined> {
    let userDetails = await this.keycloakService.loadUserProfile();
    return userDetails.id;
  }

  ngOnInit(): void {

    let keycloakUserId: string = "";

    this.getKeycloakUserId().then(v => {

    });
  }


  startSerach() {
    this.userService.findUsersByUsername(this.searchUser).subscribe(
      user => {
        console.log(user)  ;

      }
    );
  }

  sendInviteToUser() {

    // this.teamService.sendInv(this.userKeycloakId);

  }
}
