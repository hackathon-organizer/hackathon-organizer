import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {UserService} from "../../core/services/user-service/user.service";
import dayjs from "dayjs";
import {UserManager} from "../../shared/UserManager";
import {ToastrService} from "ngx-toastr";
import {concatMap} from "rxjs";
import {HackathonRequest} from "../model/Hackathon";

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
    private router: Router,
    private toastr: ToastrService
  ) {
  }

  ngOnInit(): void {
    this.newHackathonForm = this.formBuilder.group({
      hackathonName: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.required, Validators.minLength(15)]],
      organizerInfo: ['', [Validators.required, Validators.minLength(15)]],
      startDate: ['', [Validators.required, this.dateValidator()]],
      endDate: ['', [Validators.required, this.dateValidator()]],
    }, {validators: this.groupDateValidator});
  }

  createHackathon() {

    const hackathon: HackathonRequest = this.buildHackathon();

    this.hackathonService.createHackathon(hackathon).pipe(
      concatMap(hackathonResponse => {
        this.router.navigateByUrl('/hackathon/' + hackathonResponse.id);
        UserManager.currentUserFromLocalStorage.currentHackathonId = hackathonResponse.id;

        return this.userService.updateUserMembership({currentHackathonId: hackathonResponse.id})
      })).subscribe(() => {
      this.toastr.success("Hackathon " + hackathon.name + " created successfully");
    });
  }


  groupDateValidator(group: AbstractControl): ValidationErrors | null {
    const fromCtrl = group.get('startDate')!;
    const toCtrl = group.get('endDate')!;

    return dayjs(fromCtrl.value).isAfter(dayjs(toCtrl.value)) ? {dateErrorMessage: 'Please provide correct event dates'} : null;
  }

  dateValidator(): ValidatorFn {

    return (control: AbstractControl): { [key: string]: any } | null => {

      const today = new Date();

      if (!(control && control.value)) {
        return null;
      }

      return new Date(control.value) < today ? {dateErrorMessage: 'You cannot use past dates'} : null;
    }
  }

  private buildHackathon(): HackathonRequest {
    return {
      name: this.newHackathonForm.get('hackathonName')?.value,
      description: this.newHackathonForm.get('description')?.value,
      organizerInfo: this.newHackathonForm.get('organizerInfo')?.value,
      ownerId: UserManager.currentUserFromLocalStorage.id,
      eventStartDate: this.newHackathonForm.get('startDate')?.value,
      eventEndDate: this.newHackathonForm.get('endDate')?.value
    };
  }
}
