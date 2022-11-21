import { Component, OnInit } from '@angular/core';
import {UserService} from "../../core/services/user-service/user.service";
import {User} from "../../user/model/User";
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {ActivatedRoute} from "@angular/router";
import {PaginationInstance} from "ngx-pagination";
import {UserResponseDto} from "../../user/model/UserResponseDto";
import {debounceTime, switchMap} from "rxjs";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'ho-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: []
})
export class UserListComponent implements OnInit {

  loading = false;
  hackathonId = 1;
  hackathonParticipants: UserResponseDto[] = [];
  participantsIds: number[] = [];
  usernameControl: FormControl = new FormControl();

  paginationConfig: PaginationInstance = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };

  constructor(private hackathonService: HackathonService, private route: ActivatedRoute, private userService: UserService) { }

  ngOnInit(): void {

    this.route.params.subscribe(params => {

      this.loading = true;
      this.hackathonId = params['id'];

      this.hackathonService.getHackathonParticipantsIds(this.hackathonId).subscribe(participantsIds => {
             this.participantsIds = participantsIds;

             this.getHackathonParticipants(1);
      })
    });

    this.usernameControl.valueChanges.pipe(debounceTime(500),
      switchMap((username: string) => {

        this.loading = true;
        return this.userService.findHackathonUsersByUsername(username, this.hackathonId, this.paginationConfig.currentPage - 1)
      }))
      .subscribe(usersResponse => {
        this.hackathonParticipants = usersResponse.content;

        console.log(usersResponse)

        this.paginationConfig.currentPage = usersResponse.number + 1;
        this.paginationConfig.totalItems = usersResponse.totalElements;

        this.loading = false;
      });
  }

  onPageChange(page: number): void {
    this.loading = true;

    this.paginationConfig.currentPage = page;

    this.getHackathonParticipants(page);
  }

  getHackathonParticipants(pageNumber: number) {

    this.userService.getParticipants(this.participantsIds, pageNumber - 1).subscribe(part => {
      this.hackathonParticipants = part.content;

      this.paginationConfig.currentPage = part.number + 1;
      this.paginationConfig.totalItems = part.totalElements;

      this.loading = false;
    });
  }

  get currentPageNumber(): number {
    return this.paginationConfig.currentPage;
  }

}
