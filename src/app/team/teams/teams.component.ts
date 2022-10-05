import { Component, OnInit } from '@angular/core';
import {TeamService} from "../../core/services/team-service/team.service";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'ho-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss']
})
export class TeamsComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();
  hackathonId: number = 0;

  teams: any[] = [];

  constructor(private hackathonService: HackathonService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe(params => {
      this.hackathonId = params['id'];
      this.getHackathonTeams(params['id']);
    });
  }

  getHackathonTeams(hackathonId: number) {
      this.hackathonService.getHackathonTeamsById(hackathonId).subscribe(res =>
      {
        this.teams = res ;
        console.log(res);
      });
  }

}
