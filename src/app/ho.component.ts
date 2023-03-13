import {Component, OnDestroy, OnInit} from '@angular/core';

@Component({
  selector: 'ho-root',
  templateUrl: './ho.component.html',
  styleUrls: []
})
export class HoComponent implements OnInit, OnDestroy {

  constructor() {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    sessionStorage.clear();
  }
}
