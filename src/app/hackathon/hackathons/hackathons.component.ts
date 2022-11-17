import { Component, OnInit } from '@angular/core';
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {HackathonDto} from "../model/Hackathon";
import {PaginationInstance} from "ngx-pagination";

@Component({
  selector: 'ho-hackathons',
  templateUrl: './hackathons.component.html',
  styleUrls: []
})
export class HackathonsComponent implements OnInit {

  hackathons: HackathonDto[] = [];

  loading = true;

  paginationConfig: PaginationInstance = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };

  constructor(private hackathonService: HackathonService) { }

  ngOnInit(): void {

    this.getHackathons(1);
  }

  getHackathons(pageNumber: number) {
    this.hackathonService.getAllHackathons(pageNumber - 1).subscribe(
      hackathonsResponse => {

      this.hackathons = hackathonsResponse.content;
      this.paginationConfig.currentPage = hackathonsResponse.number + 1;
      this.paginationConfig.totalItems = hackathonsResponse.totalElements;

      this.loading = false;
    });
  }

  onPageChange(page: number): void {
    this.loading = true;

    this.paginationConfig.currentPage = page;

    this.getHackathons(page);
  }

  get currentPageNumber() {
    return this.paginationConfig.currentPage;
  }

  get hackathonsCount() {
      return this.paginationConfig.totalItems;
  }
}
