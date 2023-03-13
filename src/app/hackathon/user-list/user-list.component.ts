import {Component, OnInit} from '@angular/core';
import {UserService} from "../../core/services/user-service/user.service";
import {UserResponse} from "../../user/model/User";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {ActivatedRoute} from "@angular/router";
import {PaginationInstance} from "ngx-pagination";
import {concatMap, debounceTime, finalize, switchMap} from "rxjs";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'ho-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: []
})
export class UserListComponent implements OnInit {

  loading = false;
  hackathonId = 1;
  hackathonParticipants: UserResponse[] = [];
  participantsIds: number[] = [];
  usernameControl: FormControl = new FormControl();

  paginationConfig: PaginationInstance = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };

  constructor(private hackathonService: HackathonService, private route: ActivatedRoute, private userService: UserService) {
  }

  get currentPageNumber(): number {
    return this.paginationConfig.currentPage;
  }

  ngOnInit(): void {

    this.route.params.pipe(
      concatMap((params) => {

        this.hackathonId = params['id'];
        return this.hackathonService.getHackathonParticipantsIds(this.hackathonId)
      })).pipe(finalize(() => this.loading = true)).subscribe(participantsIds => {

      this.loading = true;
      this.participantsIds = participantsIds;
      this.getHackathonParticipants(1);
    });

    this.usernameControl.valueChanges.pipe(debounceTime(500),
      switchMap((username: string) => {

        this.loading = true;
        return this.userService.findHackathonUsersByUsername(username, this.hackathonId, this.paginationConfig.currentPage - 1)
      })).pipe(finalize(() => this.loading = false)).subscribe(usersResponse => {

      this.hackathonParticipants = usersResponse.content;

      this.paginationConfig.currentPage = usersResponse.number + 1;
      this.paginationConfig.totalItems = usersResponse.totalElements;
    });
  }

  onPageChange(page: number): void {
    this.loading = true;

    this.paginationConfig.currentPage = page;

    this.getHackathonParticipants(page);
  }

  private getHackathonParticipants(pageNumber: number): void {

    this.userService.getParticipants(this.participantsIds, pageNumber - 1).pipe(finalize(() => this.loading = false))
      .subscribe(participants => {
        this.hackathonParticipants = participants.content;

        this.paginationConfig.currentPage = participants.number + 1;
        this.paginationConfig.totalItems = participants.totalElements;
      });
  }
}
