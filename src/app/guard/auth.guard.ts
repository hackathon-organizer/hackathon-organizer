import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {


  constructor(
    router: Router,
  ) {
  }

  async isAccessAllowed() {
    // route: ActivatedRouteSnapshot,
    // state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    //
    // if (!this.authenticated) {
    //   await this.keycloak.login({
    //     redirectUri: window.location.origin,
    //   });
    // }
    //
    // return this.authenticated;
    return false;
  }
}
