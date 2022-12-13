import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {forkJoin, Subscription} from "rxjs";
import {UserService} from "../../core/services/user-service/user.service";
import {UserResponseDto} from "../model/UserResponseDto";
import {TeamService} from "../../core/services/team-service/team.service";
import {TeamInvitation} from "../../team/model/TeamInvitation";
import {Notification} from "../model/Notification";
import {NotificationType} from "../model/NotificationType";
import {MeetingNotification} from "../../team/model/MeetingNotification";
import {FormBuilder, FormGroup} from "@angular/forms";
import {Tag, Team, TeamResponsePage} from "../../team/model/TeamRequest";
import {ToastrService} from "ngx-toastr";
import {Utils} from "../../shared/Utils";
import {KeycloakService} from "keycloak-angular";

@Component({
  selector: 'ho-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: []
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private routeSubscription: Subscription = new Subscription();

  notificationsArray: Notification[] = [];

  user!: UserResponseDto;
  avatarUrl = "";

  editMode = false;

  userEditForm!: FormGroup;
  tags: Tag[] = [];

  currentTeamName?: string;
  currentUserId?: number;

  userRoles: string[] = [];

  teamSuggestions: Team[] = [];

  constructor(private route: ActivatedRoute,
              private userService: UserService,
              private keycloakService: KeycloakService,
              private teamService: TeamService,
              private formBuilder: FormBuilder,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.userService.userNotificationsObservable.subscribe((notifications) => {
      this.notificationsArray = notifications;
    });

    this.routeSubscription = this.route.params.subscribe(params => {

      this.userService.getUserById(params['id']).subscribe(user => {
        this.user = user;
        this.currentUserId = Utils.currentUserFromLocalStorage.id;

        this.avatarUrl = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" + user.username;

        this.currentTeamName = Utils.currentUserTeamFromLocalStorage?.name;
      });
    });
  }

  checkIfUserHasMentorRole() {
    return this.userService.checkUserAccess;
  }

  inviteToTeam() {

    console.log(this.userService.user.currentTeamId);

    const teamId = this.userService.user.currentTeamId!;

    const username = this.user.username;

    this.teamService.sendTeamInvitation(this.user.id, teamId, username).subscribe();
  }

  updateInvitation(inviteNumber: number, accepted: boolean) {

    const invite: TeamInvitation = this.notificationsArray[inviteNumber] as TeamInvitation;

    this.teamService.updateInviteStatus(invite, accepted).subscribe(() => {
      if (accepted) {
        this.userService.updateUserMembership({currentHackathonId: this.user.currentHackathonId, currentTeamId: invite.teamId})
          .subscribe(() => this.toastr.success("You are now member of team " + invite.teamName));
      } else {
        this.toastr.success("Invitation rejected");
      }

      this.notificationsArray.splice(inviteNumber,  1);
    });
  }

  asInvitation(notification: Notification): TeamInvitation {
    return notification as TeamInvitation;
  }

  asMeeting(notification: Notification): MeetingNotification {
    return notification as MeetingNotification;
  }

  edit() {

    this.userEditForm = this.formBuilder.group({
      description: [this.user.description],
    });

    this.userService.getTags().subscribe(tagsResponse => {

      this.tags = tagsResponse;

      this.userEditForm.addControl("tags", this.buildTagsFormGroup(this.tags));

      this.editMode = true;
    });
  }

  getUserTeamSuggestions() {
        if (this.user.currentHackathonId) {
        this.teamService.getTeamSuggestions(this.user.tags, this.user.currentHackathonId).subscribe(
          suggestions => {
            this.teamSuggestions = suggestions;
          });
        }
  }

  buildTagsFormGroup(tags: Tag[]): FormGroup {
    let group = this.formBuilder.group({});

    tags.forEach(tag => {

      const userTagsNames = this.user.tags.map(tag => tag.name);

      if (userTagsNames.includes(tag.name)) {
        tag.isSelected = true;
      }
      group.addControl(String(tag.id), this.formBuilder.control(false));
    });

    return group;
  }

  markTag(index: number) {
    this.tags[index].isSelected = !this.tags[index].isSelected;
  }

  private getSelectedTags(): Tag[] {
    return this.tags.filter(tag => tag.isSelected);
  }

  save() {
    const updatedUser = {
      description: this.userEditForm.get("description")?.value,
      tags: this.getSelectedTags()
    };

    this.userService.updateUserProfile(updatedUser, this.user.id)
      .subscribe(() => {

        this.toastr.success("Profile updated successfully")
        this.user.description = this.userEditForm.get("description")?.value;
        this.user.tags = this.getSelectedTags();
      });

    this.editMode = false;
  }

  isUserInTeam(): boolean {
    return Utils.isUserTeamMember();
    // if (this.user) {
    //   return (this.user.currentTeamId !== null && this.user.currentHackathonId !== null);
    // } else {
    //   return false;
    // }
  }

  isThisMyProfile(): boolean {

    if (this.user) {
      return Number(this.user.id) === Number(this.currentUserId);
    } else {
      return false;
    }
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
