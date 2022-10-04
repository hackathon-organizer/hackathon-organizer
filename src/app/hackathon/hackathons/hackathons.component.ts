import { Component, OnInit } from '@angular/core';
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";

@Component({
  selector: 'ho-hackathons',
  templateUrl: './hackathons.component.html',
  styleUrls: ['./hackathons.component.scss']
})
export class HackathonsComponent implements OnInit {

  hackathons: any[] = [];

  constructor(private hackathonService: HackathonService) { }

  ngOnInit(): void {

    this.getHackathons();
  }

  getHackathons() {
    this.hackathonService.getAllHackathons().subscribe(hack =>
    {
      this.hackathons = hack;
    });
  }

}
