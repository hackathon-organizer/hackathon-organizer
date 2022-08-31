import { Component, OnInit } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import {KeycloakService} from "keycloak-angular";

@Component({
  selector: 'ho-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  constructor(private keycloakService: KeycloakService) {
  }


  async getKeycloakUserId(): Promise<string | undefined> {
    let userDetails = await this.keycloakService.loadUserProfile();
    return userDetails.id;
  }

  ngOnInit(): void {

    let keycloakUserId: string = "";

      this.getKeycloakUserId().then(v => {

        keycloakUserId = v!;

        console.log(v);

        this.openWsConn(keycloakUserId);
      });





  }


  openWsConn(kcUserId: string) {
    const client = new Client({
      brokerURL: 'ws://localhost:9090/websocket?userId=' + kcUserId,
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });


    client.onConnect = function (frame) {
      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
      console.log("CONNECTING...");
      client.subscribe('/user/topic/private-notifications', (message: any) => {
        // called when the client receives a STOMP message from the server
        console.log(message);
        if (message.body) {
          alert('got message with body ' + message.body);
        } else {
          alert('got empty message');
        }
      });
    };

    client.onStompError = function (frame) {
      // Will be invoked in case of error encountered at Broker
      // Bad login/passcode typically will cause an error
      // Complaint brokers will set `message` header with a brief message. Body may contain details.
      // Compliant brokers will terminate the connection after any error
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);
    };

    client.activate();
  }



}
