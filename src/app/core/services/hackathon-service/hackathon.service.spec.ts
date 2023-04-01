import {TestBed} from '@angular/core/testing';

import {HackathonService} from './hackathon.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {HackathonRequest, HackathonResponse} from "../../../hackathon/model/Hackathon";
import {LoggerTestingModule} from "ngx-logger/testing";
import {KeycloakService} from "keycloak-angular";
import {ToastrModule, ToastrService} from "ngx-toastr";
import {TeamResponse} from "../../../team/model/Team";
import {Criteria, CriteriaAnswer} from "../../../hackathon/model/Criteria";

describe('HackathonService', () => {
  let service: HackathonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, LoggerTestingModule, ToastrModule.forRoot()],
      providers: [KeycloakService, ToastrService]
    });
    service = TestBed.inject(HackathonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  const BASE_URL_UPDATE = 'http://localhost:9090/api/v1/write/hackathons/';
  const BASE_URL_READ = 'http://localhost:9090/api/v1/read/hackathons/';

  const mockHackathonRequest: HackathonRequest = {
    name: 'Test Hackathon',
    eventStartDate: new Date(),
    eventEndDate: new Date(),
    description: 'A test hackathon',
    organizerInfo: "info",
    ownerId: 1
  };

  const mockTeams = [
    {id: 1, name: 'Team 1', score: 5, description: "desc", ownerId: 1, teamChatRoomId: 1, tags: [], isOpen: true},
    {id: 2, name: 'Team 2', score: 4, description: "desc", ownerId: 2, teamChatRoomId: 2, tags: [], isOpen: true}
  ];

  const mockHackathonResponse: HackathonResponse = {
    id: 1,
    name: 'Test Hackathon',
    eventStartDate: new Date(),
    eventEndDate: new Date(),
    description: 'A test hackathon',
    hackathonParticipantsNumber: 1,
    logoName: "",
    isActive: true
  };

  const mockCriteriaAnswers: CriteriaAnswer[] = [
    {id: 1, userId: 1, criteriaId: 1, value: 30, teamId: 1},
    {id: 2, userId: 2, criteriaId: 1, value: 30, teamId: 1},
    {id: 3, userId: 3, criteriaId: 2, value: 30, teamId: 1}
  ];

  const teamScore: TeamResponse[] = [
    {id: 1, name: 'Team 1', score: 50, description: "desc", ownerId: 1, teamChatRoomId: 1, tags: [], isOpen: true},
    {id: 2, name: 'Team 2', score: 400, description: "desc", ownerId: 2, teamChatRoomId: 2, tags: [], isOpen: true}
  ];

  it('should create hackathon', () => {

    service.createHackathon(mockHackathonRequest).subscribe(response => {
      expect(response).toEqual(mockHackathonResponse);
    });

    const request = httpMock.expectOne(BASE_URL_UPDATE.slice(0, -1));
    expect(request.request.method).toBe('POST');
    request.flush(mockHackathonResponse);
  });


  it('should return hackathon by id', () => {

    service.getHackathonById(1).subscribe(response => {
      expect(response).toEqual(mockHackathonResponse);
    });

    const request = httpMock.expectOne(BASE_URL_READ + '1');
    expect(request.request.method).toBe('GET');
    request.flush(mockHackathonResponse);
  });


  it('should return a list of hackathon participants ids', () => {
    const mockParticipants = [1, 2, 3];
    const hackathonId = 1;

    service.getHackathonParticipantsIds(hackathonId).subscribe((participants) => {
      expect(participants).toEqual(mockParticipants);
    });

    const request = httpMock.expectOne(BASE_URL_READ + '1/participants');
    expect(request.request.method).toBe('GET');
    request.flush(mockParticipants);
  });

  it('should return a list of hackathon teams', () => {
    const hackathonId = 1;

    service.getHackathonTeamsById(hackathonId).subscribe((teams) => {
      expect(teams).toEqual(mockTeams);
    });

    const request = httpMock.expectOne(BASE_URL_READ + '1/teams');
    expect(request.request.method).toBe('GET');
    request.flush(mockTeams);
  });

  it('should return a list of hackathon rating criteria answers', () => {

    const hackathonId = 1;
    const userId = 1;

    service.getHackathonRatingCriteriaAnswers(hackathonId, userId).subscribe((criteriaAnswers) => {
      expect(criteriaAnswers).toEqual(mockCriteriaAnswers);
    });

    const request = httpMock.expectOne(BASE_URL_READ + '1/criteria/answers?userId=1');
    expect(request.request.method).toBe('GET');
    request.flush(mockCriteriaAnswers);
  });

  it('should return a list of hackathon rating criteria', () => {
    const mockCriteria: Criteria[] = [{
      id: 1,
      name: 'Criteria name',
      hackathonId: 1
    }];

    const hackathonId = 1;

    service.getHackathonRatingCriteria(hackathonId).subscribe((criteria) => {
      expect(criteria).toEqual(mockCriteria);
    });

    const request = httpMock.expectOne(BASE_URL_READ + '1/criteria');
    expect(request.request.method).toBe('GET');
    request.flush(mockCriteria);
  });

  it('should save team rating criteria answers', () => {
    const hackathonId = 1;

    service.saveTeamRating(hackathonId, mockCriteriaAnswers).subscribe(result => {
      expect(result).toEqual(mockCriteriaAnswers);
    });

    const request = httpMock.expectOne(BASE_URL_UPDATE + '1/criteria/answers');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(mockCriteriaAnswers);
    request.flush(mockCriteriaAnswers);
  });

  it('should delete criteria', () => {
    const hackathonId = 1;
    const idToDelete = 1;
    service.deleteCriteria(hackathonId, idToDelete).subscribe(result => {
      expect(result).toBeUndefined();
    });

    const request = httpMock.expectOne(BASE_URL_UPDATE + '1/criteria/1');
    expect(request.request.method).toBe('DELETE');
  });

  it('should get leaderboard', () => {
    const hackathonId = 1;
    service.getLeaderboard(hackathonId).subscribe(result => {
      expect(result).toEqual(teamScore);
    });

    const request = httpMock.expectOne(BASE_URL_READ + '1/leaderboard');
    expect(request.request.method).toBe('GET');
    request.flush(teamScore);
  });

  it('should add user to the hackathon participants', () => {
    const hackathonId = 1;
    const userId = 1;

    service.addUserToHackathon(hackathonId, userId).subscribe();

    const req = httpMock.expectOne(BASE_URL_UPDATE + '1/participants/1');
    expect(req.request.method).toEqual('PATCH');
  });
});
