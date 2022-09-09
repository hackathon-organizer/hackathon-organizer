import {Component, OnDestroy, OnInit} from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import {KeycloakService} from "keycloak-angular";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {UserService} from "../../core/services/user-service/user.service";
import {UserResponseDto} from "../model/UserResponseDto";
import {TeamService} from "../../core/services/team-service/team.service";

@Component({
  selector: 'ho-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private routeSubscription: Subscription = new Subscription();

  user!: UserResponseDto;

  constructor(private route: ActivatedRoute, private userService: UserService, private teamService: TeamService) {
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe(params => {

      this.userService.getUserById(params['id']).subscribe(user => this.user = user);
    })
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  inviteToTeam() {

    const teamId = 100;
    this.teamService.sendTeamInvitation(this.user.keyCloakId, teamId).subscribe();
  }
}
