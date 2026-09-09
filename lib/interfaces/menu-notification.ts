export interface MenuNotificationSummary {
  activityCount: number;
  operationRecruitmentCount: number;
  activityResultCount: number;
  newActivityIds: string[];
  newOperationRecruitmentIds: string[];
  unreadActivityResultIds: string[];
}

export type MenuNotificationFeed =
  | "activities"
  | "activity-results"
  | "operation-recruitments";
