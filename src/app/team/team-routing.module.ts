import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {TeamProfileComponent} from "./team-profile/team-profile.component";
import {UserSerachComponent} from "../shared/user-serach/user-serach.component";
import {NewTeamFormComponent} from "./new-team-form/new-team-form.component";


const routes: Routes = [
  {path: '', component: TeamProfileComponent},
  {path: 'invite', component: UserSerachComponent},
  {path: 'new', component: NewTeamFormComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRoutingModule {
  static components = [
     TeamProfileComponent, NewTeamFormComponent
  ];
}
