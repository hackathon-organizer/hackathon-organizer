import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "./guard/auth.guard";
import {HomepageComponent} from "./core/homepage/homepage.component";

const routes: Routes = [
  {path: '', component: HomepageComponent},
  // { path: '**', redirectTo: '' }
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then((m) => m.UserModule)
  },
  {
    path: 'hackathon',
    loadChildren: () =>
      import('./hackathon/hackathon.module').then((m) => m.HackathonModule)
  },
  {
    path: 'team',
    loadChildren: () =>
      import('./team/team.module').then((m) => m.TeamModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class HoRoutingModule {
}
