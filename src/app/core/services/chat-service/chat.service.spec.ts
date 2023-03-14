import {TestBed} from '@angular/core/testing';

import {ChatService} from './chat.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {LoggerTestingModule} from "ngx-logger/testing";
import {ChatMessage} from "../../../team/model/Chat";

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  const BASE_URL = "http://localhost:9090";

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, LoggerTestingModule],
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  const msg = {
    entryText: "text",
    username: "name",
    userId: 1,
    teamId: 1,
    createdAt: new Date(),
  } as ChatMessage;

  const msg2 = {
    entryText: "text",
    username: "name",
    userId: 1,
    teamId: 1,
    createdAt: new Date(),
  } as ChatMessage;

  const messages: ChatMessage[] = [msg, msg2];

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return chat messages', () => {

    service
      .getChatRoomMessages(1)
      .subscribe((response) => {
        expect(response.length).toEqual(messages.length);
        expect(response[0].username).toEqual(messages[0].username);
      });

    const req = httpMock.expectOne(BASE_URL + '/api/v1/messages/rooms/1');

    req.flush(messages);
    expect(req.request.method).toEqual('GET');
  })
});
