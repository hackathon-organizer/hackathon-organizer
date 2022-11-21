import {TagResponseDto} from "./TagResponseDto";
import {HackathonDto} from "../../hackathon/model/Hackathon";

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

export interface UserResponsePage {
  content: UserResponseDto[];
  number: number;
  totalElements: number;
  totalPages: number;
}
