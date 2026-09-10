export interface ActivityApplicantCount {
  activityId: string;
  activityTitle: string;
  newApplicantCount: number;
}

export interface ApplicantNotificationSummary {
  totalCount: number;
  sinceCheckpoint: string | null;
  activities: ActivityApplicantCount[];
}
