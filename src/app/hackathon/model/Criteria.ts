export interface Criteria {
  id: number;
  name: string;
  criteriaAnswers: CriteriaAnswer[];
}

export interface CriteriaAnswer {
  teamId: number;
  userId: number;
  value: number;
}
