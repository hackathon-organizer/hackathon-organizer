import {UserResponseDto} from "../user/model/UserResponseDto";
import {Team, TeamResponsePage} from "../team/model/TeamRequest";
import {NGXLogger} from "ngx-logger";

export class Utils {

  public static get currentUserFromLocalStorage(): UserResponseDto {

    const user = localStorage.getItem("user") as string;

    return JSON.parse(user) as UserResponseDto;
  }

  public static get currentUserTeamFromLocalStorage(): Team {

    const team = localStorage.getItem("team") as string;

    return JSON.parse(team) as Team;
  }

  public static updateUserInLocalStorage(user: UserResponseDto): void {
    localStorage.setItem("user", JSON.stringify(user));
  }

  public static updateTeamInLocalStorage(team: Team): void {
    localStorage.setItem("team", JSON.stringify(team));
  }

  public static isUserTeamOwner() {
     return this.currentUserFromLocalStorage.id === this.currentUserTeamFromLocalStorage.ownerId;
  }

  public static isUserTeamMember() {
      return this.currentUserFromLocalStorage.currentTeamId === this.currentUserTeamFromLocalStorage.id;
  }
}
