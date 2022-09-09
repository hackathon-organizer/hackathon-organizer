import {Component, OnInit} from '@angular/core';
import {UserService} from "../../core/services/user-service/user.service";
import {UserResponseDto} from "../../user/model/UserResponseDto";

@Component({
  selector: 'ho-user-serach',
  templateUrl: './user-serach.component.html',
  styleUrls: ['./user-serach.component.scss']
})
export class UserSerachComponent implements OnInit {

  searchUserUsername = "";

  userSearchList: UserResponseDto[] = [];

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {

    // temp

    // this.userSearchList.push({
    //   username: "test",
    //   tags: ["Java", "CSS"]
    // });
  }

  startSerach() {
    this.userService.findUsersByUsername(this.searchUserUsername)
      .subscribe(foundUsers => {
        console.log(typeof foundUsers);
        this.userSearchList = foundUsers
      })
  }
}
