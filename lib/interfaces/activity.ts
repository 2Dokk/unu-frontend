import { QuarterResponse } from "./quarter";
import { AuditorDto, UserResponseDto } from "./auth";

export const ACTIVITY_STATUS_MAP: Record<string, string> = {
  CREATED: "생성됨",
  OPEN: "모집중",
  ONGOING: "진행중",
  COMPLETED: "완료됨",
};

export interface ActivityTypeResponse {
  id: string;
  name: string;
  code: string;
}

export interface ActivityResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  activityType: ActivityTypeResponse;
  assignee: UserResponseDto;
  quarter: QuarterResponse;
  startDate: string;
  endDate: string;
  parentActivityId?: string;
  budget?: number;
  budgetNote?: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: AuditorDto;
  modifiedBy: AuditorDto;
}

export interface ActivityRequest {
  title: string;
  description: string;
  status?: string;
  activityTypeId: string;
  assigneeId?: string;
  quarterId?: string;
  startDate: string;
  endDate: string;
  parentActivityId?: string;
  budget?: number;
  budgetNote?: string;
}

export interface ActivityTypeReponse {
  id: string;
  name: string;
}

export interface ActivityTypeRequest {
  name: string;
}
