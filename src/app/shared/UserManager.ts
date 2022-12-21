import {TeamResponse} from "../team/model/Team";
import {UserResponse} from "../user/model/User";

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

  public static isUserTeamOwner() {

    if (this.currentUserFromLocalStorage && this.currentUserTeamFromLocalStorage) {
      return Number(this.currentUserFromLocalStorage.id) === Number(this.currentUserTeamFromLocalStorage.ownerId);
    } else {
      return false;
    }
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
