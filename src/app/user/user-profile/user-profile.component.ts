import {Component, OnDestroy, OnInit} from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import {KeycloakService} from "keycloak-angular";
import {ActivatedRoute} from "@angular/router";
import {Observable, Subscription} from "rxjs";
import {UserService} from "../../core/services/user-service/user.service";
import {UserResponseDto} from "../model/UserResponseDto";
import {TeamService} from "../../core/services/team-service/team.service";
import {TeamInvitation} from "../../team/model/TeamInvitation";

@Component({
  selector: 'ho-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private routeSubscription: Subscription = new Subscription();

  notificationsArray: any[] = [];

  user!: UserResponseDto;

  constructor(private route: ActivatedRoute, private userService: UserService, private teamService: TeamService) {
  }

  ngOnInit(): void {

    this.userService.userNotificationsObservable.subscribe((teamInv) => {
      this.notificationsArray = teamInv;
    });

    this.routeSubscription = this.route.params.subscribe(params => {

      this.userService.getUserById(params['id']).subscribe(user => this.user = user);
    })

    console.log("current user");
    console.log(this.userService.user);
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  inviteToTeam() {

    console.log(this.userService.user.currentTeamId);

    const teamId = this.userService.user.currentTeamId!;
    this.teamService.sendTeamInvitation(this.user.id, teamId).subscribe();
  }

  acceptInvitation(inviteNumber: number, accepted: boolean) {

    const invite = this.notificationsArray[inviteNumber];

    this.teamService.updateInviteStatus(invite, accepted);
  }
}
