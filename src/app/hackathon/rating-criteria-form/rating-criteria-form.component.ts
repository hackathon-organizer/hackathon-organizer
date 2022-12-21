import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, FormControl} from "@angular/forms";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Criteria} from "../model/Criteria";

@Component({
  selector: 'ho-rating-criteria-form',
  templateUrl: './rating-criteria-form.component.html',
  styleUrls: []
})
export class RatingCriteriaFormComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  hackathonId: number = 0;

  criteriaForm!: FormGroup;

  isUpdateMode = false;

  constructor(private formBuilder: FormBuilder, private hackathonService: HackathonService, private route: ActivatedRoute) {
  }

  ngOnInit(): void {

    this.subscription = this.route.params.subscribe(params => {
      this.hackathonId = params['id']
      console.log(this.hackathonId);


      this.hackathonService.getHackathonRatingCriteria(this.hackathonId).subscribe(criteria => {

        if (criteria.length > 0) {
          this.isUpdateMode = true;
        }

         criteria.forEach(c => this.criteria.push(this.createCriteria(c.id, c.name)));
      });
    });

    this.criteriaForm = this.formBuilder.group({
      criteria: this.formBuilder.array([])
    });
  }

  createCriteria(id?: number, name?: string): FormGroup {
    return this.formBuilder.group({
      id: id,
      hackathonId: this.hackathonId,
      name: new FormControl(name ? name : "")
    });
  }

  addCriteria() {
    this.criteria.push(this.createCriteria());
  }

  saveCriteria() {

    const criteria: Criteria[] = this.criteriaForm.value.criteria;

    if (this.isUpdateMode) {

      this.hackathonService.updateHackathonRatingCriteria(this.hackathonId, criteria).subscribe();

    }  else {

      this.hackathonService.saveHackathonRatingCriteria(this.hackathonId, criteria).subscribe();
    }


  }

  remove(index: number): void {

    if (this.isUpdateMode) {

       const idToDelete = this.criteria.at(index).value.id;
       this.hackathonService.deleteCriteria(idToDelete).subscribe();
    }

    this.criteria.removeAt(index);
  }

  get criteria(): FormArray {
    return this.criteriaForm.get("criteria") as FormArray
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
