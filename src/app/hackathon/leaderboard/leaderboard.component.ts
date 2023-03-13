import {Component, OnInit} from '@angular/core';
import {TeamResponse} from "../../team/model/Team";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {ActivatedRoute} from "@angular/router";
import {finalize} from "rxjs";

@Component({
  selector: 'ho-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: []
})
export class LeaderboardComponent implements OnInit {

  teams: TeamResponse[] = [];
  hackathonId!: number;

  loading = true;

  constructor(private hackathonService: HackathonService,
    private route: ActivatedRoute) {
  }

  ngOnInit(): void {

    this.route.params.subscribe(prams => {

      this.hackathonId = prams["id"];

      this.hackathonService.getLeaderboard(this.hackathonId).pipe(finalize(() => this.loading = false))
        .subscribe(teamsResponse => {
          this.teams = teamsResponse;
        });
    });
  }
}
