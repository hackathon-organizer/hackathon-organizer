import {Component, OnInit} from '@angular/core';
import {UserService} from "../services/user-service/user.service";
import {Utils} from "../../shared/Utils";
import {Notification} from "../../user/model/Notification";

@Component({
  selector: 'ho-menu',
  templateUrl: './menu.component.html',
  styleUrls: []
})
export class MenuComponent implements OnInit {


  userHackathonId?: number = 0;
  userTeamId?: number;
  currentUserId = 0;
  username = "";

  avatarUrl = "";

  notifications: Notification[] = [];

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
    this.userService.initWsConn();

    if (Utils.currentUserFromLocalStorage) {

      const user = Utils.currentUserFromLocalStorage;

      this.currentUserId = user.id;
      this.userHackathonId = user.currentHackathonId;
      this.userTeamId = user.currentTeamId;

      this.avatarUrl = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" + user.username;

      this.userService.userNotificationsObservable.subscribe(notifications => this.notifications = notifications);
    }
  }

  logout() {
    this.userService.logout();
  }
}
