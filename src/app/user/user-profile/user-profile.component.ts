import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {concatMap, finalize, Subscription} from "rxjs";
import {UserService} from "../../core/services/user-service/user.service";
import {TeamService} from "../../core/services/team-service/team.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {Tag, TeamResponse} from "../../team/model/Team";
import {ToastrService} from "ngx-toastr";
import {UserManager} from "../../shared/UserManager";
import {NotificationType} from "../model/NotificationType";
import {MeetingNotification, Notification, TeamInvitationNotification} from "../../team/model/Notifications";
import {UserResponse} from "../model/User";
import {Role} from "../model/Role";

@Component({
  selector: 'ho-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: []
})
export class UserProfileComponent implements OnInit, OnDestroy {

  notificationsArray: Notification[] = [];
  currentUser?: UserResponse;
  user!: UserResponse;
  userProfileId?: number;
  userRoles: string[] = [];
  isThisMyProfile = false;
  isUserOrganizer = false;
  avatarUrl = "";
  editMode = false;
  userEditForm!: FormGroup;
  tags: Tag[] = [];
  currentTeamName?: string;
  teamSuggestions: TeamResponse[] = [];
  loading = false;
  private routeSubscription: Subscription = new Subscription();

  constructor(private route: ActivatedRoute,
              private router: Router,
              private userService: UserService,
              private teamService: TeamService,
              private formBuilder: FormBuilder,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.userService.userNotificationsObservable.subscribe((notifications) => {
      this.notificationsArray = notifications;
    });

    this.routeSubscription = this.route.params.pipe(concatMap(params => {

        this.userProfileId = params["id"];
        return this.userService.getUserById(params["id"]);
      })
    ).subscribe(userResponse => {

      this.user = userResponse;
      this.currentUser = UserManager.currentUserFromStorage;
      this.isThisMyProfile = this.checkIfThisIsMyProfile();

      if (this.user.currentHackathonId) {
        this.isUserOrganizer = this.userService.checkUserAccessAndMembership(this.user.currentHackathonId, Role.ORGANIZER);
      }

      this.avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${userResponse.username}&length=1`;

      if (this.currentUser?.id === this.user.id && UserManager.currentUserTeamFromStorage) {
        this.currentTeamName = UserManager.currentUserTeamFromStorage.name;
      } else if (this.user.currentTeamId) {
        this.teamService.getTeamById(this.user.currentTeamId)
          .subscribe((team) => this.currentTeamName = team.name);
      }
    });
  }

  inviteToTeam(): void {

    const teamId = this.userService.user.currentTeamId!;
    const username = this.user?.username;

    if (username) {
      this.teamService.sendTeamInvitation(this.user.id, teamId, username).subscribe(() => {
        this.toastr.success("Invitation send to user " + username);
      });
    } else {
      throw new Error("You are not member of any team");
    }
  }

  updateInvitation(invitationIndex: number, accepted: boolean): void {

    const invitation: TeamInvitationNotification = this.notificationsArray[invitationIndex] as TeamInvitationNotification;

    this.teamService.updateInvitationStatus(invitation, this.currentUser!.id, accepted).pipe(concatMap(() => {
      return this.userService.updateUserMembership({
        currentHackathonId: this.currentUser?.currentHackathonId,
        currentTeamId: invitation.teamId
      });
    })).subscribe(() => {

      if (accepted) {
        this.currentUser!.currentTeamId = invitation.teamId;
        this.userService.fetchAndUpdateTeamInStorage(this.currentUser!);
        this.currentTeamName = invitation.teamName;
        this.userService.updateUserData();

        this.router.navigate(["/hackathons/", this.currentUser?.currentHackathonId,
          "/teams/", this.currentUser?.currentTeamId]).then(() => {
          this.toastr.success("You are now member of team " + invitation.teamName);
        });
      } else {
        this.toastr.success("Invitation to team " + invitation.teamName + " rejected");
      }
    });

    this.notificationsArray.splice(invitationIndex, 1);
  }

  editProfile(): void {

    this.userEditForm = this.formBuilder.group({
      description: [this.user.description],
    });

    this.userService.getTags().subscribe(tagsResponse => {

      this.tags = tagsResponse;
      this.userEditForm.addControl("tags", this.buildTagsFormGroup(this.tags));
      this.editMode = true;
    });
  }

  getUserTeamSuggestions(): void {

    if (this.user.currentHackathonId) {
      this.loading = true;
      this.teamService.getTeamSuggestions(this.user.tags, this.user.currentHackathonId)
        .pipe(finalize(() => this.loading = false)).subscribe(
        suggestions => {
          this.teamSuggestions = suggestions;
        });
    }
  }

  saveProfile(): void {

    const updatedUser = {
      description: this.userEditForm.get("description")?.value,
      tags: this.getSelectedTags()
    };

    this.userService.updateUserProfile(updatedUser).subscribe(() => {

      this.toastr.success("Profile updated successfully")
      this.user.description = this.userEditForm.get("description")?.value;
      this.user.tags = this.getSelectedTags();
      this.userService.removeTagsNotification();
    });

    this.editMode = false;
  }

  getTeamUrl(teamId: number): string {

    if (this.user.currentTeamId && teamId) {
      return `/hackathons/${this.user.currentHackathonId}/teams/${teamId}`;
    } else {
      return "/";
    }
  }

  setUserRole(role: Role): void {

    if (this.currentUser?.currentHackathonId && this.userService.checkUserAccess(Role.ORGANIZER)
    ) {
      this.userService.updateUserRole(this.user.id, role)
        .subscribe(() => {


          this.toastr.success("Role changed for user " + this.user.username)
        });
    }
  }

  navigateToMeeting(invitationIndex: number): void {

    const inv = this.notificationsArray[invitationIndex] as MeetingNotification;
    this.router.navigate(["hackathon", this.user.currentHackathonId, "team", inv.chatId, "chat"]);
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

  private checkIfThisIsMyProfile(): boolean {
    return Number(this.currentUser?.id) === Number(this.userProfileId);
  }

  get NotificationType() {
    return NotificationType;
  }

  get Role() {
    return Role;
  }

  get isUserIsHackathonParticipant(): boolean {
    return Number(this.currentUser?.currentHackathonId) === Number(this.user?.currentHackathonId);
  }

  get isUserNotInMyHackathon(): boolean {
    return Number(this.currentUser?.currentHackathonId) !== Number(this.user.currentHackathonId);
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
