import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {UserProfileComponent} from "./user-profile/user-profile.component";


const routes: Routes = [
  {path: '', component: UserProfileComponent},
  {path: ':id', component: UserProfileComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {
  static components = [
    UserProfileComponent
  ];
}
