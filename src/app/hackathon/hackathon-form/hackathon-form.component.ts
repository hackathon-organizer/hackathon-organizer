import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from "@angular/forms";
import {ActivatedRoute, Route, Router} from "@angular/router";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {UserService} from "../../core/services/user-service/user.service";
import dayjs from "dayjs";
import {UserManager} from "../../shared/UserManager";
import {ToastrService} from "ngx-toastr";
import {concatMap, finalize, Subscription} from "rxjs";
import {HackathonRequest} from "../model/Hackathon";

@Component({
  selector: 'ho-hackathon-form',
  templateUrl: './hackathon-form.component.html',
  styleUrls: []
})
export class HackathonFormComponent implements OnInit {

  newHackathonForm!: FormGroup;
  loading = false;
  editMode = false;
  hackathonId?: number;
  private subscription: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private hackathonService: HackathonService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.subscription = this.route.params.subscribe(params => {

      if (this.router.url.includes("edit")) {
        this.hackathonId = params['id'];
        this.loadFormData();
        this.editMode = true;
      }
    });

    this.newHackathonForm = this.formBuilder.group({
      hackathonName: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.required, Validators.minLength(15)]],
      organizerInfo: ['', [Validators.required, Validators.minLength(15)]],
      startDate: ['', [Validators.required, this.dateValidator()]],
      endDate: ['', [Validators.required, this.dateValidator()]],
    }, {validators: this.groupDateValidator});
  }

  saveHackathon() {

    this.loading = true;
    const hackathon: HackathonRequest = this.buildHackathon();

    if (this.editMode && this.hackathonId) {

      this.hackathonService.updateHackathon(hackathon, this.hackathonId).subscribe(() => {
        this.router.navigate(['/hackathons/', this.hackathonId])
          .then(() => this.toastr.success("Hackathon " + hackathon.name + " updated successfully"))
      });

    } else {

      this.hackathonService.createHackathon(hackathon).pipe(
        concatMap(hackathonResponse => {

          let user = UserManager.currentUserFromStorage;
          user.currentHackathonId = hackathonResponse.id;
          this.hackathonId = hackathonResponse.id;
          UserManager.updateUserInStorage(user);

          return this.userService.updateUserMembership({currentHackathonId: hackathonResponse.id})
        })).pipe(finalize(() => this.loading = false))
        .subscribe(() => {

          this.userService.refreshToken();
          this.router.navigate(['/hackathons/' + this.hackathonId]).then(() => {
            this.toastr.success("Hackathon " + hackathon.name + " created successfully");
          });
        });
    }
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
      ownerId: UserManager.currentUserFromStorage.id,
      eventStartDate: this.newHackathonForm.get('startDate')?.value,
      eventEndDate: this.newHackathonForm.get('endDate')?.value
    };
  }

  private loadFormData(): void {

    if (this.hackathonId) {
      this.hackathonService.getHackathonById(this.hackathonId).subscribe(hackathonResponse => {

        this.newHackathonForm.get('hackathonName')?.patchValue(hackathonResponse.name);
        this.newHackathonForm.get('description')?.patchValue(hackathonResponse.description);
        this.newHackathonForm.get('organizerInfo')?.patchValue(hackathonResponse.organizerInfo);
        this.newHackathonForm.get('startDate')?.patchValue(hackathonResponse.eventStartDate);
        this.newHackathonForm.get('endDate')?.patchValue(hackathonResponse.eventEndDate);

        this.loading = false;
      });
    }
  }
}
