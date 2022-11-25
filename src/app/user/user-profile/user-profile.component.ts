import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {UserService} from "../../core/services/user-service/user.service";
import {UserResponseDto} from "../model/UserResponseDto";
import {TeamService} from "../../core/services/team-service/team.service";
import {TeamInvitation} from "../../team/model/TeamInvitation";
import {Notification} from "../model/Notification";
import {NotificationType} from "../model/NotificationType";
import {MeetingNotification} from "../../team/model/MeetingNotification";

@Component({
  selector: 'ho-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: []
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private routeSubscription: Subscription = new Subscription();

  notificationsArray: Notification[] = [];

  user!: UserResponseDto;

  constructor(private route: ActivatedRoute, private userService: UserService, private teamService: TeamService) {
  }

  ngOnInit(): void {

    this.userService.userNotificationsObservable.subscribe((notifications) => {
      this.notificationsArray = notifications;
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

    const username = localStorage.getItem("username") as string;

    this.teamService.sendTeamInvitation(this.user.id, teamId, username).subscribe();
  }

  acceptInvitation(inviteNumber: number, accepted: boolean) {

    const invite = this.notificationsArray[inviteNumber];

    this.teamService.updateInviteStatus(invite as TeamInvitation, accepted);
  }

  asInvitation(notification: Notification): TeamInvitation {
    return notification as TeamInvitation;
  }

  asMeeting(notification: Notification): MeetingNotification {
    return notification as MeetingNotification;
  }
}
