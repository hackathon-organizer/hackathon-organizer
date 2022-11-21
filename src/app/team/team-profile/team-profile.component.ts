import {Component, OnInit} from '@angular/core';
import {UserService} from "../../core/services/user-service/user.service";
import {TeamService} from "../../core/services/team-service/team.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, Subscription} from "rxjs";
import {Team, TeamResponsePage} from "../model/TeamRequest";
import {UserResponseDto} from "../../user/model/UserResponseDto";
import {ToastrService} from "ngx-toastr";
import {Utils} from "../../shared/Utils";

@Component({
  selector: 'ho-team-profile',
  templateUrl: './team-profile.component.html',
  styleUrls: []
})
export class TeamProfileComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();

  searchUser: string = "";
  hackathonId: number = 0;
  teamId: number = 0;
  team!: Team;
  teamMembers: UserResponseDto[] = [];
  user = Utils.currentUserFromLocalStorage;

  editMode = false;


  constructor(private userService: UserService, private teamService: TeamService, private route: ActivatedRoute,
              private router: Router, private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.routeSubscription = this.route.params.subscribe(params => {
      this.hackathonId = params['id'];
      this.teamId = params['teamId'];
    });

    this.teamService.getTeamById(this.teamId).subscribe(team => {
      this.team = team;

      this.getTeamMembers();
    });
  }


  joinToTeam() {
    this.teamService.addUserToTeam(this.teamId, this.userService.getUserId())
      .subscribe(() => {
        this.toastr.success("Successfully joined to team");

        this.router.navigate(["/"]);
      });
  }

  openOrCloseTeamForMembers() {

    const teamStatus = {userId: this.user.id, isOpen: !this.team.isOpen};

    if (this.isOwner){

    this.teamService.openOrCloseTeamForMembers(this.teamId, teamStatus).subscribe((isOpen) => {
      this.team.isOpen = isOpen;

      //this.toastr.success("Team is now " + this.team.isOpen ? 'open' : 'closed' + " for new members");
      this.toastr.success(`Team is now ${this.team.isOpen ? 'open' : 'closed'} for new members`);
    });
    } else {
      throw new Error("User is not team owner");
    }
  }

  getTeamMembers() {
    return this.userService.getMembersByTeamId(this.teamId).subscribe(members => this.teamMembers = members);
  }

  get isOwner() {
    return Utils.isUserTeamOwner(this.user.id, this.team.ownerId);
  }

  get isTeamMember() {
    return Utils.isUserTeamMember(this.user.currentTeamId, this.teamId);
  }

  redirectToTeamEdit() {
     this.router.navigate([`/hackathon/${this.hackathonId}/team/${this.teamId}/edit`]);
  }


}
