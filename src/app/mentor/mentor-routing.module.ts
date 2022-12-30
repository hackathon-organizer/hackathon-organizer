import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {MentorScheduleComponent} from "./mentor-schedule/mentor-schedule.component";


const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})
export class MentorRoutingModule {
  static components = [
    MentorScheduleComponent
  ];
}
