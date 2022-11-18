import { Component, OnInit } from '@angular/core';
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {HackathonDto} from "../model/Hackathon";
import {TeamService} from "../../core/services/team-service/team.service";
import {Team} from "../../team/model/TeamRequest";
import {UserResponseDto} from "../../user/model/UserResponseDto";
import {NGXLogger} from "ngx-logger";
import {Utils} from "../../shared/Utils";
import {HackathonRequest} from "../model/HackathonRequest";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'ho-hackathon-profile',
  templateUrl: './hackathon-profile.component.html',
  styleUrls: []
})
export class HackathonProfileComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();

  hackathon!: HackathonDto;

  constructor(private hackathonService: HackathonService, private teamService: TeamService, private route: ActivatedRoute,
              private logger: NGXLogger, private toastr: ToastrService) { }

  ngOnInit(): void {

    this.routeSubscription = this.route.params.subscribe(params => {

      this.hackathonService.getHackathonDetailsById(params['id']).subscribe(hackathon => {

        this.hackathon = hackathon;
      });
    });
  }

  joinHackathon() {
     this.hackathonService.addUserToHackathon(this.hackathon.id).subscribe(
       () => {
         this.logger.info("User added to hackathon " + this.hackathon.name);

         const currentUser: UserResponseDto = Utils.currentUserFromLocalStorage;
         currentUser.currentHackathonId = this.hackathon.id;

         Utils.updateUserInLocalStorage(currentUser);

         this.toastr.success("You are now member of hackathon " + this.hackathon.name);
       });
  }

  // getUserTeamSuggestions() {
  //       const user = JSON.parse(localStorage.getItem("user") as string) as UserResponseDto;
  //
  //       const userTags = user.tags;
  //
  //       this.teamService.getTeamSuggestions(userTags, this.hackathonId).subscribe(
  //         suggestions => {
  //           this.teamsSuggestions = suggestions;
  //
  //           this.logger.info("Team suggestions downloaded successfully");
  //         });
  // }
  isUserHackathonParticipant(): boolean {

    const currentUser = Utils.currentUserFromLocalStorage;

    return (currentUser.currentHackathonId === this.hackathon.id);
  }
}
