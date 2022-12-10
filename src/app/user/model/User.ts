import {HackathonRequest} from "../../hackathon/model/HackathonRequest";
import {Tag, TeamRequest} from "../../team/model/TeamRequest";

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
