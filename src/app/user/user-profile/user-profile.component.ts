import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {concatMap, forkJoin, Subject, Subscription} from "rxjs";
import {UserService} from "../../core/services/user-service/user.service";
import {TeamService} from "../../core/services/team-service/team.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {Tag, TeamResponse} from "../../team/model/Team";
import {ToastrService} from "ngx-toastr";
import {UserManager} from "../../shared/UserManager";
import {KeycloakService} from "keycloak-angular";
import {NotificationType} from "../model/NotificationType";
import {Notification, TeamInvitationNotification} from "../../team/model/Notifications";
import {UserResponse} from "../model/User";

@Component({
  selector: 'ho-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: []
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private routeSubscription: Subscription = new Subscription();

  notificationsArray: Notification[] = [];

  currentUser?: UserResponse;
  user!: UserResponse;
  userProfileId?: number;
  userRoles: string[] = [];
  isThisMyProfile = false;

  avatarUrl = "";
  editMode = false;

  userEditForm!: FormGroup;
  tags: Tag[] = [];
  currentTeamName?: string;
  teamSuggestions: TeamResponse[] = [];

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

    this.routeSubscription = this.route.params.pipe(
      concatMap(params => {
        this.userProfileId = params["id"];

        return this.userService.getUserById(params["id"])
      })
    ).subscribe(userResponse => {
      this.user = userResponse;
      this.currentUser = UserManager.currentUserFromLocalStorage;
      this.isThisMyProfile = this.checkIfThisMyProfile();
      this.avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${userResponse.username}&length=1`;

      if (this.currentUser?.id === this.user.id) {
        this.currentTeamName = UserManager.currentUserTeamFromLocalStorage.name;
      } else if (this.user.currentTeamId) {
        this.teamService.getTeamById(this.user.currentTeamId).subscribe((team) => this.currentTeamName = team.name);
      }
    });
  }

  checkIfUserHasMentorRole() {
    return this.userService.checkUserAccess;
  }

  inviteToTeam() {

    const teamId = this.userService.user.currentTeamId!;
    const username = this.user?.username;

    if (teamId && username) {
    this.teamService.sendTeamInvitation(this.user.id, teamId, username).subscribe(() => {
      this.toastr.success("Invite send to user " + username);
    });
    } else {
      throw new Error("You are not in any team");
    }
  }

  updateInvitation(invitationIndex: number, accepted: boolean): void {

    const invitation: TeamInvitationNotification = this.notificationsArray[invitationIndex] as TeamInvitationNotification;

    this.teamService.updateInviteStatus(invitation, accepted).subscribe(() => {
      if (accepted) {
        this.userService.updateUserMembership({
          currentHackathonId: this.currentUser?.currentHackathonId,
          currentTeamId: invitation.teamId
        })
          .subscribe(() => {

            this.currentUser!.currentTeamId = invitation.teamId;
            this.userService.updateTeamInLocalStorage(this.currentUser!);
            this.currentTeamName = invitation.teamName;
            this.toastr.success("You are now member of team " + invitation.teamName);
          });
      } else {
        this.toastr.success("Invitation rejected");
      }
      this.notificationsArray.splice(invitationIndex, 1);
    });
  }

  editProfile() {

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

  private buildTagsFormGroup(tags: Tag[]): FormGroup {
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

  markTag(index: number): void {
    this.tags[index].isSelected = !this.tags[index].isSelected;
  }

  private getSelectedTags(): Tag[] {
    return this.tags.filter(tag => tag.isSelected);
  }

  save(): void {
    const updatedUser = {
      description: this.userEditForm.get("description")?.value,
      tags: this.getSelectedTags()
    };

    this.userService.updateUserProfile(updatedUser, this.user.id)
      .subscribe(() => {

        this.toastr.success("Profile updated successfully")
        this.user.description = this.userEditForm.get("description")?.value;
        this.user.tags = this.getSelectedTags();

        this.userService.removeTagsNotification();
      });

    this.editMode = false;
  }

  private checkIfThisMyProfile(): boolean {
    return Number(this.currentUser?.id) === Number(this.userProfileId);
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  getTeamUrl(teamId: number): string {
    if (this.user.currentTeamId && teamId) {
      return `/hackathon/${this.user.currentHackathonId}/team/${teamId}`;
    } else {
      return "/";
    }
  }

  get NotificationType() {
    return NotificationType;
  }

  isUserIsHackathonParticipant() {
    return Number(this.currentUser?.currentHackathonId) === Number(this.user?.currentHackathonId) && this.currentUser?.currentTeamId;
  }
}
