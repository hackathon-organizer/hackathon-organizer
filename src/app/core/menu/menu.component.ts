import {Component, OnInit} from '@angular/core';
import {UserService} from "../services/user-service/user.service";

@Component({
  selector: 'ho-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {


  userHackathonId: number = 0;
  userTeamId: number = 0;

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
    this.userService.initWsConn();

    this.userService.loading.subscribe(loaded => {
      if (!loaded) {
        this.userHackathonId = this.userService.userHackathonId;
        this.userTeamId = this.userService.userTeamId;
      }
    });
  }

  logout() {
    this.userService.logout();
  }
}
