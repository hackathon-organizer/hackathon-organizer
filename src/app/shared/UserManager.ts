import {TeamResponse} from "../team/model/Team";
import {UserResponse} from "../user/model/User";

export class UserManager {

  public static get currentUserFromStorage(): UserResponse {

    const user = sessionStorage.getItem("user") as string;

    return JSON.parse(user) as UserResponse;
  }

  public static get currentUserTeamFromStorage(): TeamResponse {

    const team = sessionStorage.getItem("team") as string;

    return JSON.parse(team) as TeamResponse;
  }

  public static updateUserInStorage(user: UserResponse): void {
    sessionStorage.setItem("user", JSON.stringify(user));
  }

  public static updateTeamInStorage(team: TeamResponse): void {
    sessionStorage.setItem("team", JSON.stringify(team));
  }

  public static isUserTeamMember(teamId: number) {

    if (this.currentUserFromStorage && teamId) {
      return Number(this.currentUserFromStorage.currentTeamId) === Number(teamId);
    } else {
      return false;
    }
  }

  public static isUserHackathonMember(hackathonId: number) {

    if (this.currentUserFromStorage) {
      return Number(this.currentUserFromStorage.currentHackathonId) === Number(hackathonId);
    } else {
      return false;
    }
  }
}
