import {Tag} from "../../team/model/Team";

export interface User {
  id: number;
  username: string;
  keyCloakId: string;
  description: string;
  tags: Tag[];
  currentHackathonId?: number;
  currentTeamId?: number;
}

export interface UserMembershipRequest {
  userId?: number;
  currentHackathonId?: number;
  currentTeamId?: number;
}

export interface UserResponse {
  id: number;
  username: string;
  keyCloakId: string;
  description?: string;
  currentHackathonId?: number;
  currentTeamId?: number;
  tags: Tag[];
}

export interface UserResponsePage {
  content: UserResponse[];
  number: number;
  totalElements: number;
  totalPages: number;
}
