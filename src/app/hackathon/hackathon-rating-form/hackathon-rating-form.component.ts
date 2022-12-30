import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {Criteria} from "../model/Criteria";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {ActivatedRoute} from "@angular/router";
import {forkJoin, map, Observable, Subscription} from "rxjs";
import {TeamResponse} from "../../team/model/Team";
import {NGXLogger} from "ngx-logger";


@Component({
  selector: 'ho-hackathon-rating-form',
  templateUrl: './hackathon-rating-form.component.html',
  styleUrls: []
})
export class HackathonRatingFormComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  criteriaForm!: FormGroup;

  teams: TeamResponse[] = [];

  scale: number = 10;

  currentTeam?: TeamResponse;

  currentTeamId?: number;
  hackathonId!: number;

  teamsNumber: number = 0;

  constructor(private formBuilder: FormBuilder,
              private hackathonService: HackathonService,
              private route: ActivatedRoute,
              private logger: NGXLogger) {
  }

  ngOnInit(): void {

    this.criteriaForm = this.formBuilder.group({
      criteria: this.formBuilder.array([])
    });

    this.subscription = this.route.params.subscribe(params => {

      this.hackathonId = params["id"];

      forkJoin([
        this.hackathonService.getHackathonRatingCriteria(this.hackathonId),
        this.hackathonService.getHackathonTeamsById(this.hackathonId)
      ]).pipe(map(([criteria, teams]) => {

          this.teams = teams;

          this.currentTeam = this.teams[0];
          this.currentTeamId = this.currentTeam.id;

          criteria.forEach(c => this.criteria.push(this.createCriteria(c.name, c.id)));
        }
      )).subscribe(() => this.logger.info("Criteria and teams for hackathon: {} fetched", this.hackathonId));
    });
  }

  changeValue($event: any, index: number) {

    const criteria = this.criteria.at(index);

    criteria.get("criteriaAnswer")?.patchValue({
      teamId: this.currentTeamId,
      value: $event.target.value
    });
  }

  private createCriteria(name: string, id: number): FormGroup {

    return this.formBuilder.group({
      id: id,
      name: name,
      criteriaAnswer: new FormGroup({
        teamId: new FormControl(0),
        value: new FormControl("0"),
        userId: new FormControl(localStorage.getItem("userId"))
      })
    });
  }

  private rateTeam(): Observable<any> {

    const answers: Criteria[] = [];

    this.criteria.controls.forEach(c => answers.push(c.value as Criteria));

    return this.hackathonService.saveTeamRating(this.hackathonId, answers);
  }

  nextTeam() {

    this.rateTeam().subscribe(() => {
      this.resetFormValues();

      if (this.teamsNumber < this.teams.length - 1) {
        this.currentTeam = this.teams[++this.teamsNumber];
        this.currentTeamId = this.currentTeam.id;
      }
    });
  }

  previousTeam() {

    this.resetFormValues();

    if (this.teamsNumber < 1) {
      return;
    } else {
      this.currentTeam = this.teams[--this.teamsNumber];
      this.currentTeamId = this.currentTeam.id;
    }
  }

  private resetFormValues() {

    this.criteria.controls.forEach(c => c.get("criteriaAnswer")?.patchValue({
      teamId: 0,
      value: 0
    }));
  }

  get criteria(): FormArray {
    return this.criteriaForm.get("criteria") as FormArray;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
