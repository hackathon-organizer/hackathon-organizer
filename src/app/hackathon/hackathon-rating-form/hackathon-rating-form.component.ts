import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Criteria, CriteriaAnswer} from "../model/Criteria";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {ActivatedRoute} from "@angular/router";
import {forkJoin, map, Subscription} from "rxjs";
import {TeamResponse} from "../../team/model/Team";


@Component({
  selector: 'ho-hackathon-judging-form',
  templateUrl: './hackathon-rating-form.component.html',
  styleUrls: []
})
export class HackathonRatingFormComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  criteriaForm!: FormGroup;

  teams!: TeamResponse[]

  scale: number = 10;

  currentTeam!: TeamResponse;

  currentTeamId: number = 0;

  teamNumber: number = 0;

  constructor(private formBuilder: FormBuilder, private hackathonService: HackathonService, private route: ActivatedRoute,
              private ref: ChangeDetectorRef) {
  }

  ngOnInit(): void {

    this.subscription = this.route.params.subscribe(params => {

      forkJoin([
        this.hackathonService.getHackathonRatingCriteria(params['id']),
        this.hackathonService.getHackathonTeamsById(params['id'])
      ]).pipe(map(([criteria, teams]) => {

          this.teams = teams;

          this.currentTeam = this.teams[0];
          this.currentTeamId = this.currentTeam.id;

        console.log(criteria)

          criteria.forEach(c => {
            this.criteria.push(this.createCriteria(c.name, c.id))
          });
        }
      )).subscribe();
    });


    this.criteriaForm = this.formBuilder.group({
      criteria: this.formBuilder.array([])
    });
  }


  changeVal($event: any, index: number) {

    const criteria = this.criteria.at(index);

    criteria.get("criteriaAnswer")?.patchValue({
      teamId: this.currentTeamId,
      value: $event.target.value
    });

    console.log(this.criteriaForm.value);
    console.log(this.criteria.controls)
  }

  createCriteria(name: string, id: number): FormGroup {

    return this.formBuilder.group({
      id: id,
      name: name,
      criteriaAnswer: new FormGroup({
        teamId: new FormControl(0),
        value: new FormControl('0'),
        userId: new FormControl(localStorage.getItem("userId"))
      })
    });
  }

  rateTeam() {

    const answers: Criteria[] = [];

    this.criteria.controls.forEach(c => answers.push(c.value as Criteria));

    console.log(answers)

    this.hackathonService.saveTeamRating(1, answers).subscribe();
  }

  nextTeam() {
    this.rateTeam();

    this.resetFormValues();

    if (this.teamNumber < this.teams.length - 1) {
      this.currentTeam = this.teams[++this.teamNumber];
      this.currentTeamId = this.currentTeam.id;
    }
  }

  prevTeam() {

    this.resetFormValues();

    if (this.teamNumber < 1) {
      return;
    } else {
      this.currentTeam = this.teams[--this.teamNumber];
      this.currentTeamId = this.currentTeam.id;
    }
  }

  resetFormValues() {

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
