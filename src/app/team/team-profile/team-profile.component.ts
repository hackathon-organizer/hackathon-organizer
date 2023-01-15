import {Component, OnInit} from '@angular/core';
import {UserService} from "../../core/services/user-service/user.service";
import {TeamService} from "../../core/services/team-service/team.service";
import {ActivatedRoute, Router} from "@angular/router";
import {concatMap, Subscription} from "rxjs";
import {TeamResponse} from "../model/Team";
import {ToastrService} from "ngx-toastr";
import {UserManager} from "../../shared/UserManager";
import {UserResponse} from "../../user/model/User";

@Component({
  selector: 'ho-team-profile',
  templateUrl: './team-profile.component.html',
  styleUrls: []
})
export class TeamProfileComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();

  hackathonId: number = 0;
  teamId: number = 0;
  team?: TeamResponse;
  teamMembers: UserResponse[] = [];
  user = UserManager.currentUserFromLocalStorage;

  editMode = false;

  constructor(private userService: UserService,
              private teamService: TeamService,
              private route: ActivatedRoute,
              private router: Router,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.routeSubscription = this.route.params.pipe(
      concatMap(params => {

        this.hackathonId = params['id'];
        this.teamId = params['teamId'];

        return this.teamService.getTeamById(this.teamId);
      })
    ).subscribe(teamResponse => {
      this.team = teamResponse;

      this.getTeamMembers();
    });
  }


  joinToTeam() {

    this.teamService.addUserToTeam(this.teamId, UserManager.currentUserFromLocalStorage.id).pipe(
      concatMap(() => this.userService.updateUserMembership({
        currentHackathonId: this.hackathonId,
        currentTeamId: this.teamId
      }))).subscribe(() => {

      UserManager.currentUserFromLocalStorage.currentTeamId = this.teamId;
      this.user.currentTeamId = this.teamId;
      this.userService.fetchAndUpdateTeamInLocalStorage(this.user);

      this.toastr.success("Successfully joined to team");
      this.router.navigate(["/hackathon/", this.hackathonId, "/team/", this.teamId]);
    });
  }

  openOrCloseTeamForMembers() {

    if (this.isOwner && this.team) {

      const teamStatus = {userId: this.user.id, isOpen: !this.team.isOpen};

      this.teamService.openOrCloseTeamForMembers(this.teamId, teamStatus).subscribe((isOpen) => {
        this.team!.isOpen = isOpen;

        this.toastr.success(`Team is now ${this.team!.isOpen ? 'open' : 'closed'} for new members`);
      });
    } else {
      throw new Error("User is not team owner");
    }
  }

  getTeamMembers() {
    return this.userService.getMembersByTeamId(this.teamId).subscribe(members => this.teamMembers = members);
  }

  get isUserTeamMember() {
    return UserManager.isUserTeamMember(this.teamId);
  }

  get isOwner() {
    return this.userService.isUserTeamOwner(this.teamId);
  }

  get isHackathonMember() {
    return UserManager.isUserHackathonMember(this.hackathonId);
  }

  redirectToTeamEdit() {
    this.router.navigate([`/hackathon/${this.hackathonId}/team/${this.teamId}/edit`]);
  }
}
