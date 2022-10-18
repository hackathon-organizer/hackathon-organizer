import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Criteria} from "../model/Criteria";

@Component({
  selector: 'ho-hackathon-judging-form',
  templateUrl: './hackathon-rating-form.component.html',
  styleUrls: ['./hackathon-rating-form.component.scss']
})
export class HackathonRatingFormComponent implements OnInit {

  criteriaForm!: FormGroup;

  criteria: Criteria[] = [];

  scale: number = 10;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {


    this.criteriaForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
    });

  }

}
