import { QuarterResponse } from "./quarter";
import { UserResponseDto } from "./auth";

export const ACTIVITY_STATUS_MAP: Record<string, string> = {
  CREATED: "생성됨",
  OPEN: "모집중",
  ONGOING: "진행중",
  COMPLETED: "완료됨",
};

export interface ActivityTypeResponse {
  id: number;
  name: string;
}

export interface ActivityResponse {
  id: number;
  title: string;
  description: string;
  status: string;
  activityType: ActivityTypeResponse;
  assignee: UserResponseDto;
  quarter: QuarterResponse;
  startDate: string;
  endDate: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface ActivityRequest {
  title: string;
  description: string;
  status?: string;
  activityTypeId: number;
  assigneeId?: number;
  quarterId: number;
  startDate: string;
  endDate: string;
}

export interface ActivityTypeReponse {
  id: number;
  name: string;
}

export interface ActivityTypeRequest {
  name: string;
}
