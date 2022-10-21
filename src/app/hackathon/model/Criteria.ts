export interface Criteria {
  id: number;
  name: string;
  hackathonId?: number;
  criteriaAnswers?: CriteriaAnswer[];
}

export interface CriteriaAnswer {
  teamId: number;
  userId: number;
  value: number;
}
