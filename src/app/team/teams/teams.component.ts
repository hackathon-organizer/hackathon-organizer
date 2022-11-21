import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {TeamService} from "../../core/services/team-service/team.service";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {debounce, debounceTime, Subscription, switchMap} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {PaginationInstance} from "ngx-pagination";
import {Team} from "../model/TeamRequest";
import {FormControl, FormControlName} from "@angular/forms";

@Component({
  selector: 'ho-teams',
  templateUrl: './teams.component.html',
  styleUrls: []
})
export class TeamsComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();
  hackathonId: number = 0;

  teams: Team[] = [];

  loading = true;
  teamNameControl: FormControl = new FormControl();

  paginationConfig: PaginationInstance = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };

  constructor(private teamsService: TeamService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe(params => {
      this.hackathonId = params['id'];
      this.getHackathonTeams(params['id'], 1);
    });

    this.teamNameControl.valueChanges.pipe(debounceTime(500),
      switchMap((teamName: string) => {

        this.loading = true;
        return this.teamsService.searchTeamByName(teamName, this.hackathonId, this.paginationConfig.currentPage - 1)
      }))
      .subscribe(teamsResponse => {
        this.teams = teamsResponse.content;

        this.paginationConfig.currentPage = teamsResponse.number + 1;
        this.paginationConfig.totalItems = teamsResponse.totalElements;

        this.loading = false;
      });
  }

  getHackathonTeams(hackathonId: number, pageNumber: number) {
      this.teamsService.getTeamsByHackathonId(hackathonId, pageNumber - 1).subscribe(
        teamsResponse => {
        this.teams = teamsResponse.content;

          console.log(teamsResponse)

        this.paginationConfig.currentPage = teamsResponse.number + 1;
        this.paginationConfig.totalItems = teamsResponse.totalElements;

        this.loading = false;
      });
  }

  onPageChange(page: number): void {
    this.loading = true;

    this.paginationConfig.currentPage = page;

    this.getHackathonTeams(this.hackathonId, page);
  }

  get currentPageNumber() {
    return this.paginationConfig.currentPage;
  }

  get teamsCount() {
    return this.paginationConfig.totalItems;
  }
}
