import {TestBed} from '@angular/core/testing';

import {TeamService} from './team.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {Tag, TeamRequest, TeamResponse} from "../../../team/model/Team";
import {TeamInvitationNotification} from "../../../team/model/Notifications";
import {NotificationType} from "../../../user/model/NotificationType";
import {KeycloakService} from "keycloak-angular";
import {ToastrService} from "ngx-toastr";

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  const teamInvitationNotification: TeamInvitationNotification = {
    id: 1,
    fromUserName: 'user1',
    invitationStatus: 'PENDING',
    notificationType: NotificationType.INVITATION,
    teamName: 'team1',
    teamId: 1,
    toUserKeycloakId: "id",
    message: "msg",
  };

  const mockTeamRequest: TeamRequest = {
    ownerId: 1,
    hackathonId: 1,
    name: "Team name",
    description: "desc",
    tags: []
  };

  const mockTeamResponse: TeamResponse = {
    id: 1,
    name: "Team name",
    description: "desc",
    ownerId: 1,
    isOpen: true,
    teamChatRoomId: 1,
    tags: []
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a team invitation', () => {
    const userId = 1;
    const teamId = 1;
    const username = 'testuser';
    service.sendTeamInvitation(userId, teamId, username).subscribe(result => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne(service.BASE_URL_UPDATE + '1/invitations?username=testuser');
    expect(req.request.method).toBe('POST');
  });

  it('should return team suggestions', () => {
    const userTags: Tag[] = [
      {
        id: 1,
        name: 'tag1',
        isSelected: false
      }, {
        id: 2,
        name: 'tag2',
        isSelected: false
      }];
    const hackathonId = 1;

    service.getTeamSuggestions(userTags, hackathonId).subscribe(result => {
      expect(result.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne(service.BASE_URL_READ + 'suggestions?hackathonId=1');
    expect(req.request.method).toBe('POST');
    req.flush(userTags);
  });

  it('should update the invitation status to "ACCEPTED"', () => {

    const accepted = true;
    const expected = {
      id: 1,
      fromUserName: 'user1',
      invitationStatus: 'ACCEPTED',
      teamName: 'team1',
      teamId: 1
    };

    service.updateInvitationStatus(teamInvitationNotification, accepted)
      .subscribe(actual => {
        expect(actual).toEqual(expected);
      });

    const req = httpMock.expectOne(`http://localhost:9090/api/v1/write/teams/${teamInvitationNotification.teamId}/invitations`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(expected);
    req.flush(expected);
  });

  it('should update the invitation status to "REJECTED"', () => {

    const accepted = false;
    const expected = {
      id: 1,
      fromUserName: 'user1',
      invitationStatus: 'REJECTED',
      teamName: 'team1',
      teamId: 1
    };

    service.updateInvitationStatus(teamInvitationNotification, accepted)
      .subscribe(actual => {
        expect(actual).toEqual(expected);
      });

    const req = httpMock.expectOne(`http://localhost:9090/api/v1/write/teams/${teamInvitationNotification.teamId}/invitations`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(expected);
    req.flush(expected);
  });


  it('should send a team invitation', () => {
    const userId = 1;
    const teamId = 1;
    const username = 'user1';
    const expected = {message: 'Invitation sent'};

    service.sendTeamInvitation(userId, teamId, username)
      .subscribe(actual => {
        expect(actual).toEqual(expected);
      });

    const req = httpMock.expectOne(service.BASE_URL_UPDATE + '1/invitations?username=user1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(userId);
    req.flush(expected);
  });


  it('should return a team response page', () => {
    const name = 'team';
    const hackathonId = 1;
    const pageNumber = 0;
    const expectedResponse = {
      content: [mockTeamResponse],
      totalPages: 0,
      totalElements: 0,
      number: 0
    };

    service.searchTeamByName(name, hackathonId, pageNumber).subscribe(response => {
      expect(expectedResponse.content.length).toEqual(1);
      expect(response).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne(service.BASE_URL_READ + 'search?hackathonId=1&name=team&page=0&size=10');
    expect(req.request.method).toEqual('GET');
    req.flush(expectedResponse);
  });


  it('should update team', () => {
    const teamId = 1;

    service.updateTeam(mockTeamRequest, teamId).subscribe(response => {
      expect(response).toEqual(mockTeamResponse);
    });

    const req = httpMock.expectOne(`http://localhost:9090/api/v1/write/teams/${teamId}`);
    expect(req.request.method).toEqual('PUT');
    req.flush(mockTeamResponse);
  });

  it('should create a new team', () => {
    service.createTeam(mockTeamRequest).subscribe((team: TeamResponse) => {
      expect(team).toEqual(mockTeamResponse);
    });

    const req = httpMock.expectOne('http://localhost:9090/api/v1/write/teams');
    expect(req.request.method).toEqual('POST');
    req.flush(mockTeamResponse);
  });

  it('should return a list of tags', () => {

    const mockTags: Tag[] = [
      {id: 1, name: 'tag1', isSelected: true},
      {id: 2, name: 'tag2', isSelected: true}
    ];

    service.getTags().subscribe((tags: Tag[]) => {
      expect(tags.length).toBe(2);
      expect(tags).toEqual(mockTags);
    });

    const req = httpMock.expectOne('http://localhost:9090/api/v1/read/teams/tags');
    expect(req.request.method).toEqual('GET');
    req.flush(mockTags);
  });

  it('should return team by id', () => {

    const mockTeamId = 1;

    service.getTeamById(mockTeamId).subscribe((team: TeamResponse) => {
      expect(team).toEqual(mockTeamResponse);
    });

    const req = httpMock.expectOne('http://localhost:9090/api/v1/read/teams/1');
    expect(req.request.method).toEqual('GET');
    req.flush(mockTeamResponse);
  });


  it('should update team status', () => {
    const teamId = 1;
    const teamStatus = {isOpen: true};

    service.openOrCloseTeamForMembers(teamId, teamStatus).subscribe((response) => {
      expect(response).toBeTrue();
    });

    const req = httpMock.expectOne(`http://localhost:9090/api/v1/write/teams/${teamId}`);
    expect(req.request.method).toEqual('PATCH');
    expect(req.request.body).toEqual(teamStatus);
    req.flush(true);
  });
});
