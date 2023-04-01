import {TestBed} from '@angular/core/testing';

import {UserService} from './user.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {UserDetails, UserMembershipRequest, UserResponse, UserResponsePage} from "../../../user/model/User";
import {KeycloakService} from "keycloak-angular";
import {ToastrModule, ToastrService} from "ngx-toastr";
import {LoggerTestingModule} from "ngx-logger/testing";
import {UserManager} from "../../../shared/UserManager";
import {Tag} from "../../../team/model/Team";
import {ScheduleEntryRequest, ScheduleEntryResponse} from "../../../mentor/model/ScheduleEntry";
import {environment} from "../../../../environments/environment";

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, LoggerTestingModule, ToastrModule.forRoot()],
      providers: [KeycloakService, ToastrService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  let BASE_URL_UPDATE = environment.API_URL + "/api/v1/write/users/";
  let BASE_URL_READ = environment.API_URL + "/api/v1/read/users/";

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  const mockUserResponse: UserResponse = {
    id: 1,
    username: 'john.doe',
    hackathonId: 123,
    keyCloakId: "id",
    tags: []
  } as UserResponse;

  const mockUserResponsePage: UserResponsePage = {
    content: [
      mockUserResponse,
      {id: 2, username: 'john.doe2', hackathonId: 123, keyCloakId: "id", tags: []} as UserResponse,
    ],
    number: 0,
    totalElements: 2,
    totalPages: 1
  };

  const mockScheduleRequests: ScheduleEntryRequest[] = [
    {
      id: 1,
      sessionStart: new Date(),
      sessionEnd: new Date(),
      hackathonId: 1
    }
  ];

  const expectedScheduleEntryResponse: ScheduleEntryResponse[] = [{
    id: 1,
    userId: 1,
    sessionStart: mockScheduleRequests[0].sessionStart as Date,
    sessionEnd: mockScheduleRequests[0].sessionEnd as Date,
    teamId: 1,
    isAvailable: true
  }];


  it('should retrieve users by username and hackathon ID', () => {
    const username = 'john.doe';
    const hackathonId = 1;
    const pageNumber = 0;

    service.findHackathonUsersByUsername(username, hackathonId, pageNumber)
      .subscribe(response => {
        expect(response.content.length).toEqual(2);
        expect(response).toEqual(mockUserResponsePage);
      });

    const req = httpMock.expectOne(BASE_URL_READ.slice(0, -1) + "?username=john.doe&hackathonId=1&page=0&size=10");
    expect(req.request.method).toBe('GET');
    req.flush(mockUserResponsePage);
  });

  it('should retrieve a user by ID', () => {
    const userId = 1;

    service.getUserById(userId)
      .subscribe(response => {
        expect(response).toEqual(mockUserResponse);
      });

    const request = httpMock.expectOne(BASE_URL_READ + "1");
    expect(request.request.method).toBe('GET');
    request.flush(mockUserResponse);
  });

  it('should return a UserResponsePage object', () => {

    const username = 'testuser';
    const hackathonId = 1;
    const pageNumber = 0;

    service.findHackathonUsersByUsername(username, hackathonId, pageNumber)
      .subscribe(userResponsePage => {
        expect(userResponsePage).toEqual(mockUserResponsePage);
      });

    const req = httpMock.expectOne(BASE_URL_READ.slice(0, -1) + '?username=testuser&hackathonId=1&page=0&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockUserResponsePage);
  });

  it('should return a UserResponse object', () => {

    const userId = 1;

    service.getUserById(userId)
      .subscribe(userResponse => {
        expect(userResponse).toEqual(mockUserResponse);
      });

    const req = httpMock.expectOne(BASE_URL_READ + "1");
    expect(req.request.method).toBe('GET');
    req.flush(mockUserResponse);
  });

  it('should send a PATCH request to update user profile', () => {
    const updatedUser: UserDetails = {description: "desc", tags: []};

    UserManager.updateUserInStorage(mockUserResponse);

    service.updateUserProfile(updatedUser).subscribe(response => {
      expect(response).toEqual(mockUserResponsePage);
    });

    const req = httpMock.expectOne(BASE_URL_UPDATE + '1');
    expect(req.request.method).toBe('PATCH');
    req.flush(mockUserResponsePage);
  });

  it('should send a GET request to get tags', () => {
    const expectedResponse: Tag[] = [{id: 1, name: 'tag1', isSelected: false}, {id: 2, name: 'tag2', isSelected: true}];
    service.getTags().subscribe(response => {
      expect(response).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne(BASE_URL_READ + 'tags');
    expect(req.request.method).toBe('GET');
    req.flush(expectedResponse);
  });

  it('should send a PATCH request to update user membership', () => {

    UserManager.updateUserInStorage(mockUserResponse);

    const updatedUserMembership: UserMembershipRequest = {
      userId: 1,
      currentHackathonId: 2
    };

    service.updateUserMembership(updatedUserMembership).subscribe();

    const req = httpMock.expectOne(BASE_URL_UPDATE + '1/membership');
    expect(req.request.method).toBe('PATCH');
  });

  it('should make a POST request to the correct URL with the given entry event', () => {

    UserManager.updateUserInStorage(mockUserResponse);

    service.createEntryEvent(mockScheduleRequests[0]).subscribe((response) => {
      expect(response).toEqual(expectedScheduleEntryResponse[0]);
    });

    const req = httpMock.expectOne(BASE_URL_UPDATE + '1/schedule');
    expect(req.request.method).toEqual('POST');
    req.flush(expectedScheduleEntryResponse[0]);
  });

  it('should make a PUT request to the correct URL with the given mockScheduleRequests', () => {

    UserManager.updateUserInStorage(mockUserResponse);

    service.updateEntryEvents(mockScheduleRequests).subscribe(() => {
      expect().nothing();
    });

    const req = httpMock.expectOne(BASE_URL_UPDATE + '1/schedule');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(mockScheduleRequests);

    req.flush(mockScheduleRequests);
  });


  it('should make a GET request to the correct URL with the given hackathon ID', () => {
    const hackathonId = 1;
    UserManager.updateUserInStorage(mockUserResponse);

    service.getUserSchedule(hackathonId).subscribe((response) => {
      expect(response).toEqual(expectedScheduleEntryResponse);
    });

    const req = httpMock.expectOne(BASE_URL_READ + '1/schedule?hackathonId=1');
    expect(req.request.method).toEqual('GET');

    req.flush(expectedScheduleEntryResponse);
  });


  it('should make a  hackathon mockScheduleRequests request to the correct URL with the given hackathon ID', () => {
    const hackathonId = 1;

    service.getHackathonSchedule(hackathonId).subscribe((response) => {
      expect(response).toEqual(expectedScheduleEntryResponse);
    });

    const req = httpMock.expectOne(BASE_URL_READ + '/schedule?hackathonId=1');
    expect(req.request.method).toEqual('GET');

    req.flush(expectedScheduleEntryResponse);
  });
});
