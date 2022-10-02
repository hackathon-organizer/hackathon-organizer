import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
  selector: 'ho-new-hackathon-form',
  templateUrl: './new-hackathon-form.component.html',
  styleUrls: ['./new-hackathon-form.component.scss']
})
export class NewHackathonFormComponent implements OnInit {

  newHackathonForm!: FormGroup;
  errorMsg = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.newHackathonForm = this.formBuilder.group({
      hackathonName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.minLength(15)]],
      organizerInfo: ['', [Validators.minLength(3)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
    });
  }

  createHackathon() {

  }
}
