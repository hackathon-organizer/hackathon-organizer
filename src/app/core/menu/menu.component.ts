import {Component, OnInit} from '@angular/core';
import {UserService} from "../services/user-service/user.service";
import {Utils} from "../../shared/Utils";

@Component({
  selector: 'ho-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {


  userHackathonId: number = 0;
  userTeamId: number = 0;
  currentUserId = 0;

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
    this.userService.initWsConn();

    if (Utils.currentUserFromLocalStorage) {
      this.currentUserId = Utils.currentUserFromLocalStorage.id;
      this.userHackathonId = Utils.currentUserFromLocalStorage.currentHackathonId;
      this.userTeamId = Utils.currentUserFromLocalStorage.currentTeamId;
    }
  }

  logout() {
    this.userService.logout();
  }
}
