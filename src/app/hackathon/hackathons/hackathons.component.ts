import { Component, OnInit } from '@angular/core';
import {HackathonService} from "../../core/services/hackathon-service/hackathon.service";
import {HackathonDto} from "../model/Hackathon";

@Component({
  selector: 'ho-hackathons',
  templateUrl: './hackathons.component.html',
  styleUrls: ['./hackathons.component.scss']
})
export class HackathonsComponent implements OnInit {

  hackathons: HackathonDto[] = [];

  constructor(private hackathonService: HackathonService) { }

  ngOnInit(): void {

    this.getHackathons();
  }

  getHackathons() {
    this.hackathonService.getAllHackathons().subscribe(hack =>
    {
      console.log(hack)
      this.hackathons = hack;
    });
  }

}
