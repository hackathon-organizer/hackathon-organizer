import {KeycloakService} from "keycloak-angular";

export function initializeKeycloak(
  keycloak: KeycloakService
) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8080' + '/auth',
        realm: 'hackathon-organizer',
        clientId: 'hackathon-organizer-client',
      },
      initOptions: {
        // // must match to the configured value in keycloak
        // redirectUri: 'http://localhost:4200/your_url',
        // this will solved the error
        checkLoginIframe: false
      }
    });
}
