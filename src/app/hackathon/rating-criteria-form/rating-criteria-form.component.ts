import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from "@angular/forms";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Criteria} from "../model/Criteria";

@Component({
  selector: 'ho-rating-criteria-form',
  templateUrl: './rating-criteria-form.component.html',
  styleUrls: ['./rating-criteria-form.component.scss']
})
export class RatingCriteriaFormComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  hackathonId: number = 0;

  criteriaForm!: FormGroup;

  constructor(private formBuilder: FormBuilder, private hackathonService: HackathonService, private route: ActivatedRoute) {
  }

  ngOnInit(): void {

    this.subscription = this.route.params.subscribe(params => {
      this.hackathonId = params['id']
      console.log(this.hackathonId);
    });

    this.criteriaForm = this.formBuilder.group({
      criteria: this.formBuilder.array([])
    });
  }

  createCriteria(): FormGroup {
    return this.formBuilder.group({
      name: ""
    });
  }

  addCriteria() {
    this.criteria.push(this.createCriteria());
  }

  saveCriteria() {

    const criteria: Criteria[] = this.criteriaForm.value;

    this.hackathonService.saveHackathonRatingCriteria(this.hackathonId, criteria).subscribe();
  }

  remove(index: number): void {
    this.criteria.removeAt(index);
  }

  get criteria(): FormArray {
    return this.criteriaForm.get("criteria") as FormArray
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
