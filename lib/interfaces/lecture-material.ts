export interface LectureMaterial {
  id: string;
  title: string;
  description: string | null;
  /** 링크에 표시할 자료 이름. 없으면 title을 그대로 쓴다. */
  materialName: string | null;
  driveUrl: string;
  weekNumber: number | null;
  primary: boolean;
  activityId: string | null;
  activityTitle: string | null;
  createdAt: string;
  modifiedAt: string | null;
}

export interface LectureMaterialRequest {
  title: string;
  description: string;
  materialName?: string | null;
  driveUrl: string;
  weekNumber?: number | null;
  activityId?: string;
}
