import {TagResponseDto} from "./TagResponseDto";
import {HackathonDto} from "../../hackathon/model/Hackathon";
import {Tag} from "../../team/model/TeamRequest";

export interface UserResponseDto {
  id: number;
  username: string;
  keyCloakId: string;
  description?: string;
  currentHackathonId?: number;
  currentTeamId?: number;
  tags: Tag[];
}

export interface UserResponsePage {
  content: UserResponseDto[];
  number: number;
  totalElements: number;
  totalPages: number;
}
