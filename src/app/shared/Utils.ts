import {UserResponseDto} from "../user/model/UserResponseDto";
import {Team, TeamResponse} from "../team/model/TeamRequest";

export class Utils {

  public static get currentUserFromLocalStorage(): UserResponseDto {

      const user = localStorage.getItem("user") as string;

      if (user) {
        return JSON.parse(user) as UserResponseDto;
      } else {
        throw new Error("Can't obtain user data from local storage. Try refreshing the page.");
      }
  }

  public static updateUserInLocalStorage(user: UserResponseDto): void {
      localStorage.setItem("user", JSON.stringify(user));
  }

  public static updateTeamInLocalStorage(team: Team): void {
    localStorage.setItem("team", JSON.stringify(team));
  }

  public static isUserTeamOwner(currentUserId: number, teamOwnerId: number) {
    return currentUserId === teamOwnerId;
  }

  public static isUserTeamMember(currentUserTeamId: number, teamId: number) {
    return currentUserTeamId === teamId;
  }
}
