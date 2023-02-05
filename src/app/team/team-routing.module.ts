import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {TeamProfileComponent} from "./team-profile/team-profile.component";
import {TeamFormComponent} from "./team-form/team-form.component";
import {TeamChatComponent} from "./team-chat/team-chat.component";
import {TeamsComponent} from "./teams/teams.component";


const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRoutingModule {
  static components = [
    TeamProfileComponent, TeamFormComponent, TeamChatComponent, TeamsComponent
  ];
}
