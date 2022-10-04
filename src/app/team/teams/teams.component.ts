import { Component, OnInit } from '@angular/core';
import {TeamService} from "../../core/services/team-service/team.service";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";

@Component({
  selector: 'ho-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss']
})
export class TeamsComponent implements OnInit {

  teams: any[] = [];

  constructor(private hackathonService: HackathonService) { }

  ngOnInit(): void {
  }

  getHackathonTeams(hackathonId: number) {
      this.hackathonService.getHackathonTeamsById(hackathonId).subscribe(res => this.teams = res);
  }

}
