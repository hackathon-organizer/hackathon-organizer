import {HackathonRequest} from "../../hackathon/model/HackathonRequest";
import {Tag, TeamRequest} from "../../team/model/TeamRequest";

export interface User {
  id: number;
  username: string;
  keyCloakId: string;
  tags: Tag[];
  currentHackathonId?: number;
  currentTeamId?: number;
}
