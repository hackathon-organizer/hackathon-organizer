import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../../core/services/user-service/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {TeamService} from "../../core/services/team-service/team.service";
import {Tag, TeamRequest, TeamResponse} from "../model/Team";
import {concatMap, finalize, Subscription} from "rxjs";
import {UserManager} from "../../shared/UserManager";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'ho-team-form',
  templateUrl: './team-form.component.html',
  styleUrls: []
})
export class TeamFormComponent implements OnInit, OnDestroy {

  newTeamForm!: FormGroup;
  teamId?: number;
  tags: Tag[] = [];
  hackathonId?: number;
  editMode = false;
  user = UserManager.currentUserFromStorage;
  loading = true;
  loadingCreate = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private teamService: TeamService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
  }

  ngOnInit(): void {

    this.initFrom();

    this.teamService.getTags().pipe(concatMap(tagsResponse => {

      this.setTags(tagsResponse);
      return this.route.params;
    })).subscribe(params => {

      this.hackathonId = params['id'];

      if (this.router.url.includes("edit")) {
        this.teamId = params['teamId'];
        this.loadFormData();
        this.editMode = true;
      } else {
        this.loading = false;
      }
    });
  }

  saveTeam(): void {
    this.loadingCreate = true;

    if (this.hackathonId && this.user) {

      const team: TeamRequest = this.buildTeam();

      if (this.editMode && this.teamId) {

        this.teamService.updateTeam(team, this.teamId).pipe(finalize(() => this.loadingCreate = false))
          .subscribe(updatedTeam => {

            this.router.navigateByUrl('/hackathons/' + this.hackathonId + '/teams/' + updatedTeam.id);
            UserManager.updateTeamInStorage(updatedTeam);
            this.toastr.success("Team " + team.name + " updated successfully");
          });
      } else {

        this.teamService.createTeam(team).pipe(concatMap((createdTeam: TeamResponse) => {

          this.user.currentTeamId = createdTeam.id;
          this.teamId = createdTeam.id;

          UserManager.updateUserInStorage(this.user);
          UserManager.updateTeamInStorage(createdTeam);

          return this.userService.updateUserMembership({
            currentHackathonId: this.hackathonId,
            currentTeamId: createdTeam.id
          });
        })).pipe(finalize(() => {
          this.loadingCreate = false;
          this.loading = false;
        })).subscribe(() => {

          this.loadingCreate = false;
          this.router.navigate(['/hackathons/', this.hackathonId, 'teams', this.teamId]).then(() => {
            window.location.reload();
            this.toastr.success("Team " + team.name + " created successfully");
          });
        });
      }
    }
  }

  private initFrom(): void {

    this.newTeamForm = this.formBuilder.group({
      teamName: ['', {
        validators: [Validators.required, Validators.minLength(5)], updateOn: 'blur'
      }],
      description: ['', {
        validators: [Validators.required, Validators.minLength(15)], updateOn: 'blur'
      }],
    });
  }

  private setTags(tags: Tag[]): void {

    this.tags = tags;
    this.newTeamForm.addControl("tags", this.buildTagsFormGroup(this.tags));
  }

  private buildTagsFormGroup(tags: Tag[]): FormGroup {

    let group = this.formBuilder.group({});
    tags.forEach(tag => {
      group.addControl(String(tag.id), this.formBuilder.control(tag.isSelected));
    });

    return group;
  }

  private loadFormData(): void {

    if (this.teamId) {
      this.teamService.getTeamById(this.teamId).subscribe(teamResponse => {

        this.newTeamForm.get('teamName')?.patchValue(teamResponse.name);
        this.newTeamForm.get('description')?.patchValue(teamResponse.description);

        teamResponse.tags.forEach(teamTag => {
          const tagToMark = this.tags.find(tag => tag.id === teamTag.id);

          if (tagToMark) {
            tagToMark.isSelected = true;
          }
        });
        this.newTeamForm.get('tags')?.patchValue(this.buildTagsFormGroup(this.tags));

        this.loading = false;
      });
    }
  }

  private buildTeam(): TeamRequest {

    if (this.hackathonId) {
      return {
        ownerId: this.user.id,
        hackathonId: this.hackathonId,
        name: this.newTeamForm.get('teamName')?.value,
        description: this.newTeamForm.get('description')?.value,
        tags: this.getSelectedTags(),
      };
    } else {
      throw new Error("Hackathon can't be null. Try refresh page.")
    }
  }

  private getSelectedTags(): Tag[] {
    return this.tags.filter(tag => tag.isSelected);
  }

  markTag(index: number): void {
    this.tags[index].isSelected = !this.tags[index].isSelected;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
