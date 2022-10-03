import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {HackathonsComponent} from "./hackathons/hackathons.component";
import {NewHackathonFormComponent} from "./new-hackathon-form/new-hackathon-form.component";
import {HackathonProfileComponent} from "./hackathon-profile/hackathon-profile.component";


const routes: Routes = [
  {path: '', component: HackathonsComponent},
  {path: 'new', component: NewHackathonFormComponent},
  {path: ':id', component: HackathonProfileComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HackathonRoutingModule {
  static components = [
    HackathonsComponent, NewHackathonFormComponent, HackathonProfileComponent
  ];
}
