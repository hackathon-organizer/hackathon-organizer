import {AfterViewInit, Component, OnInit} from '@angular/core';
import {UserService} from "../services/user-service/user.service";
import {UserManager} from "../../shared/UserManager";
import {Notification} from "../../team/model/Notifications";
import {OidcSecurityService} from "angular-auth-oidc-client";

@Component({
  selector: 'ho-menu',
  templateUrl: './menu.component.html',
  styleUrls: []
})
export class MenuComponent implements AfterViewInit {

  userHackathonId?: number;
  userTeamId?: number;
  currentUserId?: number;
  username = "";
  avatarUrl = "";
  notifications: Notification[] = [];
  userLoaded: boolean = false;
  loading = true;
  user = UserManager.currentUserFromStorage;

  constructor(private userService: UserService, private oidcSecurityService: OidcSecurityService) {
  }


  async ngAfterViewInit() {

    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData}) => {
      console.log(isAuthenticated);
      console.log(userData);
    });


    //  this.kc.getKeycloakInstance().onAuthSuccess = () => {alert("loged in")};
   //
   //
   // setTimeout(() => {
   //   this.userService.isLoggedIn().then(isLoggedIn => {
   //
   //     console.log(isLoggedIn)
   //
   //     if (isLoggedIn) {
   //       this.userService.userLoadedObservable.subscribe(userLoaded => {
   //         if (userLoaded) {
   //
   //           this.userLoaded = true;
   //
   //           const user = UserManager.currentUserFromStorage;
   //           this.currentUserId = user.id;
   //           this.userHackathonId = user.currentHackathonId;
   //           this.userTeamId = user.currentTeamId;
   //
   //           this.avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${user.username}&length=1`;
   //         } else {
   //           this.loginButtonLock = true;
   //         }
   //       });
   //     }
   //
   //     this.loadNotifications();
   //   }).catch(() => {
   //     this.logout();
   //   }).finally(() => {
   //     this.loading = false;
   //   });
   // }, 3500);
   //
   //  if (await this.kc.isLoggedIn()) {
   //   const x = await this.kc.loadUserProfile();
   //    console.log(x)
   //  }
  }

  //logout(): void {
  //   this.userService.logout();
  // }
  //
  // login(): void {
  //   this.userService.login();
  // }
  // //
  signUp(): void {
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
  }

  private loadNotifications(): void {
    this.userService.userNotificationsObservable.subscribe(notifications => {
      this.notifications = notifications
    });
  }

  checkIfUserHasMentorOrOrganizerRole(): boolean {

    // if (this.user?.currentHackathonId) {
    //   return this.userService.isUserMentorOrOrganizer(this.user.currentHackathonId);
    // } else {
      return false;
    // }
  }
}
