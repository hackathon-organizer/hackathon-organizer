import {Component, OnInit} from '@angular/core';
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {concatMap, finalize, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {HackathonResponse} from "../model/Hackathon";
import {UserManager} from "../../shared/UserManager";
import {ToastrService} from "ngx-toastr";
import {UserService} from "../../core/services/user-service/user.service";
import dayjs from "dayjs";

@Component({
  selector: 'ho-hackathon-profile',
  templateUrl: './hackathon-profile.component.html',
  styleUrls: []
})
export class HackathonProfileComponent implements OnInit {

  private routeSubscription: Subscription = new Subscription();

  hackathon!: HackathonResponse;
  loading = false;

  constructor(private hackathonService: HackathonService,
              private userService: UserService,
              private route: ActivatedRoute,
              private toastr: ToastrService) {
  }

  ngOnInit(): void {

    this.routeSubscription = this.route.params.pipe(
      concatMap((params) => this.hackathonService.getHackathonDetailsById(params['id']))
    ).subscribe(hackathon => {
      this.hackathon = hackathon;
    });
  }

  joinHackathon(): void {
    this.loading = true;

    const user = UserManager.currentUserFromStorage;

    this.hackathonService.addUserToHackathon(this.hackathon.id, user.id).pipe(concatMap(() =>
      this.userService.updateUserMembership({currentHackathonId: this.hackathon.id, currentTeamId: null})
    )).pipe(finalize(() => this.loading = false)).subscribe(() => {

      user.currentHackathonId = this.hackathon.id;
      this.toastr.success("You are now member of hackathon " + this.hackathon.name);
    });
  }

  isUserHackathonParticipant(): boolean {
    return UserManager.isUserHackathonMember(this.hackathon.id);
  }

  isUserJury(): boolean {
    return this.userService.isUserJury(this.hackathon.id);
  }

  isUserOrganizer(): boolean {
    return this.userService.isUserOrganizer(this.hackathon.id);
  }

  isActive(): boolean {
    return dayjs().isBefore(this.hackathon.eventStartDate);
  }
}
