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
  userLoaded: boolean = false;
  loading = true;
  user = UserManager.currentUserFromStorage;

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {

    this.userService.isLoggedIn().then(isLoggedIn => {

      if (isLoggedIn) {

        this.userService.userLoadedObservable.subscribe(userLoaded => {
          if (userLoaded) {
            this.userLoaded = true;

            const user = UserManager.currentUserFromStorage;
            this.currentUserId = user.id;
            this.userHackathonId = user.currentHackathonId;
            this.userTeamId = user.currentTeamId;

            this.avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${user.username}&length=1`;
            this.loading = false;
          }
        });
      } else {
        this.loading = false;
      }

      this.loadNotifications();
    });
  }

  logout(): void {
    this.userService.logout();
  }

  login(): void {
    this.userService.login();
  }

  signUp(): void {
    this.userService.signUp();
  }

  private loadNotifications(): void {
    this.userService.userNotificationsObservable.subscribe(notifications => {
      this.notifications = notifications
    });
  }

  checkIfUserHasMentorOrOrganizerRole(): boolean {

    if (this.user?.currentHackathonId) {
      return this.userService.isUserMentorOrOrganizer(this.user.currentHackathonId);
    } else {
      return false;
    }
  }
}
