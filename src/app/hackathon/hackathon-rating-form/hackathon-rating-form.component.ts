import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {Criteria, CriteriaAnswer} from "../model/Criteria";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {ActivatedRoute} from "@angular/router";
import {forkJoin, map, Observable, Subscription} from "rxjs";
import {TeamResponse} from "../../team/model/Team";
import {NGXLogger} from "ngx-logger";
import {ToastrService} from "ngx-toastr";
import {UserManager} from "../../shared/UserManager";


@Component({
  selector: 'ho-hackathon-rating-form',
  templateUrl: './hackathon-rating-form.component.html',
  styleUrls: []
})
export class HackathonRatingFormComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  criteriaForm!: FormGroup;
  teams: TeamResponse[] = [];
  teamsNumber: number = 0;
  answers: CriteriaAnswer[] = [];
  scale: number = 10;
  currentTeam?: TeamResponse;
  currentTeamId?: number;
  hackathonId!: number;
  userId = UserManager.currentUserFromLocalStorage.id;

  constructor(private formBuilder: FormBuilder,
              private hackathonService: HackathonService,
              private route: ActivatedRoute,
              private logger: NGXLogger,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.criteriaForm = this.formBuilder.group({
      criteria: this.formBuilder.array([])
    });

    this.subscription = this.route.params.subscribe(params => {

      this.hackathonId = params["id"];

      forkJoin([
        this.hackathonService.getHackathonRatingCriteria(this.hackathonId),
        this.hackathonService.getHackathonRatingCriteriaAnswers(this.hackathonId, this.userId),
        this.hackathonService.getHackathonTeamsById(this.hackathonId)
      ]).pipe(map(([criteria, answers, teams]) => {

          this.teams = teams;

          this.currentTeam = this.teams[0];
          this.currentTeamId = this.currentTeam.id;

        this.answers = answers;
        criteria.forEach(c => this.criteria.push(this.createCriteria(c.name, c.id)));
       }
      )).subscribe(() => this.logger.info("Criteria and teams for hackathon fetched", this.criteria.value, this.teams));
    });
  }

  private createCriteria(name: string, id: number): FormGroup {

    const answer = this.findAnswerForCriteria(id);

    return this.formBuilder.group({
      id: id,
      name: name,
      answer: new FormGroup({
        id: new FormControl(answer ? answer.id : null),
        teamId: new FormControl(this.currentTeamId),
        value: new FormControl(answer ? answer.value : 50),
        userId: new FormControl(this.userId)
      })
    });
  }

  private rateTeam(): Observable<any> {

    const answers: CriteriaAnswer[] = [];

    this.criteria.controls.forEach(criteria => {

      const criteriaAnswer = criteria.value.answer;

      const answer = {
        id: criteriaAnswer.id,
        criteriaId: criteria.value.id,
        teamId: this.currentTeamId,
        userId: this.userId,
        value: criteriaAnswer.value
      } as CriteriaAnswer;

      answers.push(answer);
    });

    return this.hackathonService.saveTeamRating(this.hackathonId, answers);
  }

  nextTeam() {

    this.rateTeam().subscribe((answersResponse: CriteriaAnswer[]) => {

      answersResponse.forEach(answer => {
        const index = this.answers.findIndex(ans => ans.id === answer.id);

        if (index != -1) {
          this.answers[index] = answer;
        } else {
         this.answers.push(answer);
        }
      });

      if (this.teamsNumber < this.teams.length - 1) {
        this.currentTeam = this.teams[++this.teamsNumber];
        this.currentTeamId = this.currentTeam.id;
      }

      this.updateFormValues();
      this.toastr.success("Rating saved for team " + this.currentTeam?.name);
    });
  }

  previousTeam() {

    if (this.teamsNumber < 1) {
      return;
    } else {
      this.currentTeam = this.teams[--this.teamsNumber];
      this.currentTeamId = this.currentTeam.id;
    }

    this.updateFormValues();
  }

  private updateFormValues(): void {

    this.criteria.controls.forEach(criteriaControl => {

      const answer = this.findAnswerForCriteria(criteriaControl.value.id);

      criteriaControl.get("answer")?.patchValue({
        id: answer ? answer.id : null,
        criteriaId: criteriaControl.value.id,
        value: answer?.value,
        teamId: this.currentTeamId,
        userId: this.userId
      });
    });
  }

  get criteria(): FormArray {
    return this.criteriaForm.get("criteria") as FormArray;
  }

  private findAnswerForCriteria(criteriaId: number): CriteriaAnswer | undefined {
    return this.answers.find(answer => answer.criteriaId === criteriaId && answer.teamId === this.currentTeamId);
  }

  changeValue($event: any, index: number) {

    const criteria = this.criteria.at(index);

    criteria.get("answer")?.patchValue({
      teamId: this.currentTeamId,
      value: $event.target.value
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
