import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {concatMap, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Criteria} from "../model/Criteria";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'ho-rating-criteria-form',
  templateUrl: './rating-criteria-form.component.html',
  styleUrls: []
})
export class RatingCriteriaFormComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  hackathonId!: number;
  criteriaForm!: FormGroup;
  isUpdateMode = false;

  constructor(private formBuilder: FormBuilder,
              private hackathonService: HackathonService,
              private toastr: ToastrService,
              private route: ActivatedRoute) {
  }

  ngOnInit(): void {

    this.criteriaForm = this.formBuilder.group({
      criteria: this.formBuilder.array([])
    });

    this.subscription = this.route.params.pipe(
      concatMap(params => {
        this.hackathonId = params["id"];

        return this.hackathonService.getHackathonRatingCriteria(this.hackathonId);
      })).subscribe(criteria => {

      if (criteria.length > 0) {
        this.isUpdateMode = true;
      }

      criteria.forEach(c => this.criteria.push(this.createCriteria(c.id, c.name)));
    });
  }

  private createCriteria(id?: number, name?: string): FormGroup {
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
      this.hackathonService.updateHackathonRatingCriteria(this.hackathonId, criteria).subscribe(() => {
        this.toastr.success("Criteria updated successfully")
      });
    } else {
      this.hackathonService.saveHackathonRatingCriteria(this.hackathonId, criteria).subscribe(() => {
        this.toastr.success("Criteria created successfully");
      });
    }
  }

  removeCriteria(index: number): void {

    if (this.isUpdateMode) {
      const idToDelete = this.criteria.at(index).value.id;
      this.hackathonService.deleteCriteria(idToDelete).subscribe(() => {
        this.toastr.success("Criteria deleted successfully");
      });
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
