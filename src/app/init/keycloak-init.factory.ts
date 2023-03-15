import {KeycloakService} from "keycloak-angular";
import {environment} from "../../environments/environment";

export function initializeKeycloak(
  keycloak: KeycloakService
) {
  return () =>
    keycloak.init({
      config: {
        url: environment.KEYCLOAK_URL + '/auth',
        realm: 'hackathon-organizer',
        clientId: 'hackathon-organizer-client',

      },
      initOptions: {
        redirectUri: window.location.origin,
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html'
      },
      loadUserProfileAtStartUp: true
    });
}
