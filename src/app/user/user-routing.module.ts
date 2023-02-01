import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {UserProfileComponent} from "./user-profile/user-profile.component";
import {MentorModule} from "../mentor/mentor.module";
import {MentorScheduleComponent} from "../mentor/mentor-schedule/mentor-schedule.component";
import {AuthGuard} from "../guard/auth.guard";


const routes: Routes = [
  {path: '', component: UserProfileComponent},
  {path: ':id', component: UserProfileComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule, MentorModule],
})
export class UserRoutingModule {
  static components = [
    UserProfileComponent
  ];
}
