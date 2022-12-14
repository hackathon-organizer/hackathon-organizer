import {TeamResponse} from "../team/model/Team";
import {UserResponse} from "../user/model/User";
import {KeycloakService} from "keycloak-angular";
import {Role} from "../user/model/Role";

export class UserManager {

  public static get currentUserFromLocalStorage(): UserResponse {

    const user = localStorage.getItem("user") as string;

    return JSON.parse(user) as UserResponse;
  }

  public static get currentUserTeamFromLocalStorage(): TeamResponse {

    const team = localStorage.getItem("team") as string;

    return JSON.parse(team) as TeamResponse;
  }

  public static updateUserInLocalStorage(user: UserResponse): void {
    localStorage.setItem("user", JSON.stringify(user));
  }

  public static updateTeamInLocalStorage(team: TeamResponse): void {
    localStorage.setItem("team", JSON.stringify(team));
  }

  public static isUserTeamMember(teamId: number) {

    if (this.currentUserFromLocalStorage && teamId) {
      return Number(this.currentUserFromLocalStorage.currentTeamId) === Number(teamId);
    } else {
      return false;
    }
  }

  public static isUserHackathonMember(hackathonId: number) {

    if (this.currentUserFromLocalStorage) {
      return Number(this.currentUserFromLocalStorage.currentHackathonId) === Number(hackathonId);
    } else {
      return false;
    }
  }
}
