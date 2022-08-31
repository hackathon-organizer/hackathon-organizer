import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {UserProfileComponent} from "./user/user-profile/user-profile.component";
import {AuthGuard} from "./guard/auth.guard";

const routes: Routes = [
  { path: '', component: UserProfileComponent , canActivate: [AuthGuard]},
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class HoRoutingModule { }
