import {Component, OnInit} from '@angular/core';
import {UserService} from "../services/user-service/user.service";
import {UserManager} from "../../shared/UserManager";
import {Notification} from "../../team/model/Notifications";
import {OidcSecurityService} from "angular-auth-oidc-client";
import {Role} from "../../user/model/Role";
import {environment} from "../../../environments/environment";

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
  userLoaded: boolean | undefined;
  loading = true;
  showLoggingButtons = false;
  user = UserManager.currentUserFromStorage;

  constructor(private userService: UserService,
              private oidcSecurityService: OidcSecurityService) {
  }

  ngOnInit() {

    this.userService.isUserAuthenticatedObservable.subscribe(isUserAuthenticated => {

      this.showLoggingButtons = isUserAuthenticated;
      this.loading = false;

      this.userService.userLoadedObservable.subscribe(userProfile => {

        if (isUserAuthenticated && userProfile) {
          this.userLoaded = true;

          const user = UserManager.currentUserFromStorage;
          this.currentUserId = user.id;
          this.userHackathonId = user.currentHackathonId;
          this.userTeamId = user.currentTeamId;

          this.avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${user.username}&length=1`;
        }
      });
    });
  }

  signUp(): void {

    this.oidcSecurityService.getAuthorizeUrl().subscribe(url => {
      this.oidcSecurityService.authorize(undefined, {urlHandler() {
          window.location.href = url!.replace("openid-connect/auth","openid-connect/registrations");
        },
      redirectUrl: environment.REDIRECT_URL})
    });
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoffAndRevokeTokens().subscribe(() => {
      sessionStorage.clear();
    });
  }

  checkIfUserHasMentorOrOrganizerRole(): boolean {

    if (this.userHackathonId) {
      return this.userService.checkUserAccessAndMembership(this.userHackathonId, Role.MENTOR) ||
        this.userService.checkUserAccessAndMembership(this.userHackathonId, Role.ORGANIZER);
    } else {
      return false;
    }
  }
}
