import { Component, OnInit } from '@angular/core';
import {UserService} from "../services/user-service/user.service";

@Component({
  selector: 'ho-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
  }

  logout() {
    this.userService.logout();
  }
}
