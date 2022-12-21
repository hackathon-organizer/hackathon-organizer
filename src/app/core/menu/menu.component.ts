import {Component, OnInit} from '@angular/core';
import {UserService} from "../services/user-service/user.service";
import {UserManager} from "../../shared/UserManager";
import {Notification} from "../../team/model/Notifications";

@Component({
  selector: 'ho-menu',
  templateUrl: './menu.component.html',
  styleUrls: []
})
export class MenuComponent implements OnInit {


  userHackathonId?: number;
  userTeamId?: number;
  currentUserId?: number;
  username = "";
  avatarUrl = "";
  notifications: Notification[] = [];

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
    this.userService.initWsConn();

    if (UserManager.currentUserFromLocalStorage) {

      const user = UserManager.currentUserFromLocalStorage;

      console.log('laduje')

      this.currentUserId = user.id;
      this.userHackathonId = user.currentHackathonId;
      this.userTeamId = user.currentTeamId;

      this.avatarUrl = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" + user.username;
    }

    this.userService.userNotificationsObservable.subscribe(notifications => {
      this.notifications = notifications
    });
  }

  logout() {
    this.userService.logout();
  }
}
