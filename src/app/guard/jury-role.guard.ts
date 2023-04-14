import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {map, Observable, take} from 'rxjs';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {UserService} from "../core/services/user-service/user.service";
import {Role} from "../user/model/Role";

@Injectable({
  providedIn: 'root'
})
export class JuryRoleGuard implements CanActivate {

  constructor(private oidcSecurityService: OidcSecurityService,
              private router: Router,
              private userService: UserService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {

    return this.oidcSecurityService.isAuthenticated$.pipe(
      take(1),
      map(({isAuthenticated}) => {

        if (isAuthenticated && this.userService.checkUserAccess(Role.JURY) || this.userService.checkUserAccess(Role.ORGANIZER)) {
          return true;
        }

        return this.router.parseUrl('/');
      })
    );
  }
}

