import { Component, OnDestroy, OnInit} from '@angular/core';
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {concatMap, finalize, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {HackathonResponse} from "../model/Hackathon";
import {UserManager} from "../../shared/UserManager";
import {ToastrService} from "ngx-toastr";
import {UserService} from "../../core/services/user-service/user.service";
import dayjs from "dayjs";
import {HttpEventType} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Component({
  selector: 'ho-hackathon-profile',
  templateUrl: './hackathon-profile.component.html',
  styleUrls: []
})
export class HackathonProfileComponent implements OnInit, OnDestroy {

  hackathon!: HackathonResponse;
  loading = false;
  isLoggedIn = false;
  uploadProgress: number | undefined;
  private subscription: Subscription = new Subscription();
  private uploadSubscription: Subscription = new Subscription();
  fileName: string = "No file chosen";
  logoUrl: string = "https://via.placeholder.com/800x400";

  constructor(private hackathonService: HackathonService,
              private userService: UserService,
              private route: ActivatedRoute,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.subscription = this.route.params
      .pipe(concatMap((params) => this.hackathonService.getHackathonById(params['id']))
      ).subscribe(hackathon => {
        this.hackathon = hackathon;

        if (hackathon.logoName) {
          this.logoUrl = `${environment.API_URL}/api/v1/read/hackathons/files/${hackathon.logoName}`;
        }
      });

    //this.userService.isLoggedIn().subscribe((isLoggedIn) => this.isLoggedIn = isLoggedIn);
  }

  joinHackathon(): void {

    this.loading = true;
    const user = UserManager.currentUserFromStorage;

    this.hackathonService.addUserToHackathon(this.hackathon.id, user.id)
      .pipe(concatMap(
        () => this.userService.updateUserMembership({
          currentHackathonId: this.hackathon.id,
          currentTeamId: null
        })
      )).pipe(finalize(() => this.loading = false))
      .subscribe(() => {
        user.currentHackathonId = this.hackathon.id;
        this.toastr.success("You are now participant of hackathon " + this.hackathon.name);
        this.userService.updateUserData();
      });
  }

  isUserHackathonParticipant(): boolean {
    return UserManager.isUserHackathonMember(this.hackathon.id!);
  }

  isUserJury(): boolean {
    //return this.userService.isUserJury(this.hackathon.id!);
    return false
  }

  isUserOrganizer(): boolean {
   // return this.userService.isUserOrganizer(this.hackathon.id!);
    return false
  }

  isActive(): boolean {
    return dayjs().isBefore(this.hackathon.eventStartDate);
  }

  onFileSelected(event: any): void {

    if (event.target.files[0]) {

      const file: File = event.target.files[0];
      this.fileName = file.name;

      this.uploadSubscription = this.hackathonService.uploadFile(file, this.hackathon.id)
        .pipe(finalize(() => {
          this.uploadProgress = undefined;
        }))
        .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * (event.loaded / event.total!));

          if (this.uploadProgress === 100) {
            this.toastr.success("File uploaded successfully");
            this.logoUrl = this.logoUrl.replace(new RegExp("[^\\/]+$"), file.name);
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.uploadSubscription.unsubscribe();
  }

  callFileUpload() {
    document.getElementById('file-upload')!.click();
  }
}
