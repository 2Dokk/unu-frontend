export interface ActivityNotice {
  id: string;
  title: string;
  content: string | null;
  activityId: string;
  read: boolean;
  createdAt: string;
  modifiedAt: string | null;
}

export interface ActivityNoticeUnreadCount {
  activityId: string;
  count: number;
}

export interface ActivityNoticeUnreadSummary {
  totalCount: number;
  activities: ActivityNoticeUnreadCount[];
}

export interface ActivityNoticeRequest {
  activityId: string;
  title: string;
  content: string;
}
