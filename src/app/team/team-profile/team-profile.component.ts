import { Component, OnInit } from '@angular/core';
import {UserService} from "../../core/services/user.service";
import {log} from "util";

@Component({
  selector: 'ho-team-profile',
  templateUrl: './team-profile.component.html',
  styleUrls: ['./team-profile.component.scss']
})
export class TeamProfileComponent implements OnInit {

  searchUser: string = "";

  constructor(private userService: UserService) { }

  ngOnInit(): void {

  }

  startSerach() {
    this.userService.findUserByUsername(this.searchUser).subscribe(user => console.log(user));
  }

}
