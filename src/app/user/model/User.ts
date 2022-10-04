import {HackathonRequest} from "../../hackathon/model/HackathonRequest";
import {TeamRequest} from "../../team/model/TeamRequest";

export interface User {
  id: number;
  username: string;
  keyCloakId: string;
  userCurrentHackathonId?: number;
  userCurrentTeamId?: number;
}
