import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ho-user-serach',
  templateUrl: './user-serach.component.html',
  styleUrls: ['./user-serach.component.scss']
})
export class UserSerachComponent implements OnInit {

  searchUserUsername = "";

  constructor() { }

  ngOnInit(): void {
  }

  startSerach() {

  }
}
