export interface NoticeRequest {
  title: string;
  tag: string;
  content: string;
}

export interface Notice {
  id: string;
  title: string;
  tag: string;
  content: string;
  createdAt: string;
}

export interface NoticeListResponse {
  notices: Notice[];
  total: number;
}
