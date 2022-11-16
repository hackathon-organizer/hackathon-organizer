import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../../core/services/user-service/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {TeamService} from "../../core/services/team-service/team.service";
import {Tag, TeamRequest} from "../model/TeamRequest";
import {HackathonRequest} from "../../hackathon/model/HackathonRequest";
import {Subscription} from "rxjs";
import {UserResponseDto} from "../../user/model/UserResponseDto";
import {Utils} from "../../shared/Utils";

@Component({
  selector: 'ho-new-team-form',
  templateUrl: './new-team-form.component.html',
  styleUrls: []
})
export class NewTeamFormComponent implements OnInit, OnDestroy {

  private routeSubscription: Subscription = new Subscription();

  newTeamForm!: FormGroup;
  hackathon!: HackathonRequest;
  tags: Tag[] = [];
  hackathonId: number = 0;

  constructor(
    private formBuilder: FormBuilder,
    private teamService: TeamService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    this.routeSubscription = this.route.params.subscribe(params => {

     this.hackathonId = params['id'];
    });

    this.newTeamForm = this.formBuilder.group({
      teamName: ['', {
        validators: [Validators.required, Validators.minLength(5)], updateOn: 'blur' }],
      description: ['', {
        validators: [Validators.required, Validators.minLength(15)], updateOn: 'blur'}],
    });

    this.teamService.getAvailableTags().subscribe(result => {

      this.tags = result;
      this.newTeamForm.addControl("tags", this.buildTagsFormGroup(this.tags));
    });
  }

  buildTagsFormGroup(tags: Tag[]): FormGroup {
    let group = this.formBuilder.group({});

    tags.forEach(tag => {
      tag.isSelected = false;
      group.addControl(String(tag.id), this.formBuilder.control(false));
    });
    return group;
  }

  createTeam() {

    const user = Utils.currentUserFromLocalStorage;

    if (this.hackathonId && user) {

      const team: TeamRequest = {
        ownerId: user.id,
        hackathonId: this.hackathonId,
        name: this.newTeamForm.get('teamName')?.value,
        description: this.newTeamForm.get('description')?.value,
        tags: this.tags,
      };

      this.teamService.createTeam(team).subscribe(createdTeam => {

        this.router.navigateByUrl('/hackathon/' + this.hackathonId + '/team/' + createdTeam.id);
      });
    }
  }

  markTag(index: number) {
    this.tags[index].isSelected = !this.tags[index].isSelected;
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
