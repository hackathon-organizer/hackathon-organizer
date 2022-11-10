import { Component, OnInit } from '@angular/core';
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {HackathonDto} from "../model/Hackathon";
import {TeamService} from "../../core/services/team-service/team.service";
import {Team} from "../../team/model/TeamRequest";
import {User} from "../../user/model/User";
import {UserResponseDto} from "../../user/model/UserResponseDto";

@Component({
  selector: 'ho-hackathon-profile',
  templateUrl: './hackathon-profile.component.html',
  styleUrls: ['./hackathon-profile.component.scss']
})
export class HackathonProfileComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();

  hcTitle: string = '';
  hcId: number = 0;

  hackathon!: HackathonDto;

  teamsSuggestions: Team[] = [];

  constructor(private hackathonService: HackathonService, private teamService: TeamService, private route: ActivatedRoute) { }

  ngOnInit(): void {


    this.routeSubscription = this.route.params.subscribe(params => {

      this.hackathonService.getHackathonDetailsById(params['id']).subscribe(hc => {
        this.hcTitle = hc.name;
        this.hcId = hc.id;
        this.hackathon = hc;

        this.getUserTeamSuggestions();
      });
    });
  }

  joinHackathon() {
     this.hackathonService.addUserToHackathon(this.hcId).subscribe(res => console.log("User added to hackathon" + this.hcId));
  }

  getUserTeamSuggestions() {
        const user = JSON.parse(localStorage.getItem("user") as string) as UserResponseDto;

        const userTagsIds = user.tags.map(tag => tag.id);

        this.teamService.getTeamSuggestions(userTagsIds, this.hcId).subscribe(suggestions => this.teamsSuggestions = suggestions);
  }
}
