import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {HackathonRequest} from "../model/HackathonRequest";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {UserService} from "../../core/services/user-service/user.service";

@Component({
  selector: 'ho-new-hackathon-form',
  templateUrl: './new-hackathon-form.component.html',
  styleUrls: []
})
export class NewHackathonFormComponent implements OnInit {

  newHackathonForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private hackathonService: HackathonService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.newHackathonForm = this.formBuilder.group({
      hackathonName: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.minLength(15)]],
      organizerInfo: ['', [Validators.minLength(15)]],
      // TODO add date validators
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
    });
  }

  createHackathon() {

    const hackathon: HackathonRequest = {
      name: this.newHackathonForm.get('hackathonName')?.value,
      description: this.newHackathonForm.get('description')?.value,
      organizerInfo: this.newHackathonForm.get('organizerInfo')?.value,
      ownerId: Number(localStorage.getItem("userId")),
      eventStartDate: this.newHackathonForm.get('startDate')?.value,
      eventEndDate: this.newHackathonForm.get('endDate')?.value
    };

    this.hackathonService.createHackathon(hackathon).subscribe(hackathonResponse => {

    this.router.navigateByUrl('/hackathon/' + hackathonResponse.id);
  });
  }
}
