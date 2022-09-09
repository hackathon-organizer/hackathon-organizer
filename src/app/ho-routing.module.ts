import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {UserProfileComponent} from "./user/user-profile/user-profile.component";
import {AuthGuard} from "./guard/auth.guard";
import {TeamProfileComponent} from "./team/team-profile/team-profile.component";
import {HomepageComponent} from "./core/homepage/homepage.component";

const routes: Routes = [
  { path: '', component: HomepageComponent , canActivate: [AuthGuard]},
  // { path: '**', redirectTo: '' }
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then((m) => m.UserModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'team',
    loadChildren: () =>
      import('./team/team.module').then((m) => m.TeamModule),
    canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class HoRoutingModule { }
