import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {HackathonsComponent} from "./hackathons/hackathons.component";
import {HackathonFormComponent} from "./hackathon-form/hackathon-form.component";
import {HackathonProfileComponent} from "./hackathon-profile/hackathon-profile.component";
import {TeamFormComponent} from "../team/team-form/team-form.component";
import {TeamsComponent} from "../team/teams/teams.component";
import {TeamProfileComponent} from "../team/team-profile/team-profile.component";
import {TeamChatComponent} from "../team/team-chat/team-chat.component";
import {MentorScheduleComponent} from "../mentor/mentor-schedule/mentor-schedule.component";
import {UserListComponent} from "./user-list/user-list.component";
import {HackathonRatingFormComponent} from "./hackathon-rating-form/hackathon-rating-form.component";
import {RatingCriteriaFormComponent} from "./rating-criteria-form/rating-criteria-form.component";
import {LeaderboardComponent} from "./leaderboard/leaderboard.component";
import {AuthGuard} from "../guard/auth.guard";
import {TeamOwnerRoleGuard} from "../guard/team-owner-role.guard";
import {OrganizerRoleGuard} from "../guard/organizer-role.guard";
import {JuryRoleGuard} from "../guard/jury-role.guard";


const routes: Routes = [
  {path: '', component: HackathonsComponent},
  {path: 'new', component: HackathonFormComponent, canActivate: [AuthGuard]},
  {path: ':id', component: HackathonProfileComponent},
  {path: ':id/edit', component: HackathonFormComponent, canActivate: [OrganizerRoleGuard]},
  {
    path: ':id/participants', loadChildren: () => import('../user/user.module').then(m => m.UserModule),
    component: UserListComponent, canActivate: [AuthGuard]
  },
  {
    path: ':id/teams/new', loadChildren: () => import('../team/team.module').then(m => m.TeamModule),
    component: TeamFormComponent
  },
  {
    path: ':id/teams', loadChildren: () => import('../team/team.module').then(m => m.TeamModule),
    component: TeamsComponent
  },
  {
    path: ':id/teams/:teamId/edit', loadChildren: () => import('../team/team.module').then(m => m.TeamModule),
    component: TeamFormComponent, canActivate: [TeamOwnerRoleGuard]
  },
  {
    path: ':id/teams/:teamId', loadChildren: () => import('../team/team.module').then(m => m.TeamModule),
    component: TeamProfileComponent
  },
  {
    path: ':id/teams/:teamId/chat', loadChildren: () => import('../team/team.module').then(m => m.TeamModule),
    component: TeamChatComponent, canActivate: [AuthGuard]
  },
  {
    path: ':id/teams/:teamId/invite', loadChildren: () => import('../team/team.module').then(m => m.TeamModule),
    component: TeamProfileComponent, canActivate: [AuthGuard]
  },
  {
    path: ':id/schedule', loadChildren: () => import('../mentor/mentor.module').then(m => m.MentorModule),
    component: MentorScheduleComponent
  },
  {
    path: ':id/rating',
    component: HackathonRatingFormComponent,
    canActivate: [OrganizerRoleGuard, JuryRoleGuard]
  },
  {path: ':id/rating-criteria', component: RatingCriteriaFormComponent, canActivate: [OrganizerRoleGuard]},
  {path: ':id/leaderboard', component: LeaderboardComponent, canActivate: [AuthGuard]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HackathonRoutingModule {
  static components = [
    HackathonsComponent, HackathonFormComponent, HackathonProfileComponent, UserListComponent,
    HackathonRatingFormComponent, RatingCriteriaFormComponent, LeaderboardComponent
  ];
}
