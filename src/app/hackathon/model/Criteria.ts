export interface Criteria {
  id: number;
  name: string;
  hackathonId?: number;
}

export interface CriteriaAnswer {
  id: number;
  criteriaId?: number;
  teamId: number;
  userId: number;
  value: number;
}
