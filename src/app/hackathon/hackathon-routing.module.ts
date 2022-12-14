import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {HackathonsComponent} from "./hackathons/hackathons.component";
import {NewHackathonFormComponent} from "./new-hackathon-form/new-hackathon-form.component";
import {HackathonProfileComponent} from "./hackathon-profile/hackathon-profile.component";
import {NewTeamFormComponent} from "../team/new-team-form/new-team-form.component";
import {TeamsComponent} from "../team/teams/teams.component";
import {TeamProfileComponent} from "../team/team-profile/team-profile.component";
import {TeamChatComponent} from "../team/team-chat/team-chat.component";
import {MentorScheduleComponent} from "../mentor/mentor-schedule/mentor-schedule.component";
import {UserListComponent} from "./user-list/user-list.component";
import {HackathonRatingFormComponent} from "./hackathon-rating-form/hackathon-rating-form.component";
import {RatingCriteriaFormComponent} from "./rating-criteria-form/rating-criteria-form.component";
import {LeaderboardComponent} from "./leaderboard/leaderboard.component";



const routes: Routes = [
  {path: '', component: HackathonsComponent},
  {path: 'new', component: NewHackathonFormComponent},
  {path: ':id', component: HackathonProfileComponent},
  {path: ':id/participants', component: UserListComponent},
  {path: ':id/team', component: NewTeamFormComponent},
  {path: ':id/team/:teamId/edit', component: NewTeamFormComponent},
  {path: ':id/teams', component: TeamsComponent},
  {path: ':id/team/:teamId', component: TeamProfileComponent},
  {path: ':id/team/:teamId/chat', component: TeamChatComponent},
  {path: ':id/team/:teamId/invite', component: UserListComponent},
  {path: ':id/schedule', component: MentorScheduleComponent},
  {path: ':id/rating', component: HackathonRatingFormComponent},
  {path: ':id/rating-criteria', component: RatingCriteriaFormComponent},
  {path: ':id/leaderboard', component: LeaderboardComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HackathonRoutingModule {
  static components = [
    HackathonsComponent, NewHackathonFormComponent, HackathonProfileComponent, UserListComponent,
    HackathonRatingFormComponent, RatingCriteriaFormComponent, LeaderboardComponent
  ];
}
