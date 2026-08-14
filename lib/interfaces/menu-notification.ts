export interface MenuNotificationSummary {
  activityCount: number;
  operationRecruitmentCount: number;
  newActivityIds: string[];
  newOperationRecruitmentIds: string[];
}

export type MenuNotificationFeed =
  | "activities"
  | "operation-recruitments";
