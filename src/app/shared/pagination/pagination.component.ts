import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PaginationInstance} from "ngx-pagination";

@Component({
  selector: 'ho-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: []
})
export class PaginationComponent implements OnInit {

  @Input()
  config!: PaginationInstance;

  @Output()
  pageChangeEvent = new EventEmitter<number>();

  ngOnInit(): void {
  }
}
