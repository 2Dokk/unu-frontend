export interface ActivityNotice {
  id: string;
  title: string;
  content: string | null;
  activityId: string;
  createdAt: string;
  modifiedAt: string | null;
}

export interface ActivityNoticeRequest {
  activityId: string;
  title: string;
  content: string;
}
