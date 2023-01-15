import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {KeycloakService} from "keycloak-angular";

@Injectable({
  providedIn: 'root'
})
export class OrganizerRoleGuard implements CanActivate {

  constructor(
    router: Router,
    protected readonly keycloak: KeycloakService
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      return !!this.keycloak.getKeycloakInstance().realmAccess?.roles.includes("ORGANIZER");
  }
}
