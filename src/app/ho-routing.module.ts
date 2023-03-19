import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomepageComponent} from "./core/homepage/homepage.component";
import {MenuComponent} from "./core/menu/menu.component";
import {HoComponent} from "./ho.component";
import {FooterComponent} from "./core/footer/footer.component";

const routes: Routes = [
  {path: '', component: HomepageComponent},
  //{ path: '**', redirectTo: '' },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then((m) => m.UserModule)
  },
  {
    path: 'hackathons',
    loadChildren: () => import('./hackathon/hackathon.module').then((m) => m.HackathonModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class HoRoutingModule {
  static components = [MenuComponent, HoComponent, FooterComponent, HomepageComponent];
}
