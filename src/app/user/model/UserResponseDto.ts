import {TagResponseDto} from "./TagResponseDto";

export interface UserResponseDto {
  id: number;
  username: string;
  keyCloakId: string;
  accountType: string;
  githubProfileUrl: string;
  currentHackathonId: number;
  currentTeamId: number;
  profilePictureUrl: string;
  tags: TagResponseDto[];
}
