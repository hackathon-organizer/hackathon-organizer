import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Criteria} from "../model/Criteria";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {Team} from "../../team/model/TeamRequest";

@Component({
  selector: 'ho-hackathon-judging-form',
  templateUrl: './hackathon-rating-form.component.html',
  styleUrls: ['./hackathon-rating-form.component.scss']
})
export class HackathonRatingFormComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  criteriaForm!: FormGroup;

  teams!: Team[]

  scale: number = 10;

  constructor(private formBuilder: FormBuilder, private hackathonService: HackathonService, private route: ActivatedRoute) { }

  ngOnInit(): void {

    this.subscription = this.route.params.subscribe(params => {

      this.hackathonService.getHackathonRatingCriteria(params['id']).subscribe(criteria => {

        criteria.forEach(c => this.criteria.push(this.createCriteria(c.name)));
      });
    })


    this.criteriaForm = this.formBuilder.group({
      criteria: this.formBuilder.array([])
    });
  }


  changeVal($event: any, idx: number) {

    this.criteria.at(idx).value.value = $event.target.value;

    console.log(this.criteria.controls);
  }

  createCriteria(name: string): FormGroup {
    return this.formBuilder.group({
      name: name,
      value: 0
    });
  }

  rateTeam() {

  }

  get criteria(): FormArray {
    return this.criteriaForm.get("criteria") as FormArray;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
