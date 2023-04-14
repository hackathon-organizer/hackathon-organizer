import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {map, Observable, take} from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.oidcSecurityService.isAuthenticated$.pipe(
      take(1),
      map(({isAuthenticated}) => {

        if (isAuthenticated) {
          return true;
        }

        this.oidcSecurityService.authorize();
        return this.router.parseUrl('/');
      })
    );
  }
}
