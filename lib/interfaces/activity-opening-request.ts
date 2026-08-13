import { ActivityTypeResponse } from "./activity";
import { QuarterResponse } from "./quarter";
import { UserSummaryDto } from "./auth";

export type ActivityOpeningRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED";

export interface ActivityOpeningRequestPayload {
  title: string;
  description: string;
  operationPlan: string;
  activityTypeId: string;
  quarterId: string;
  startDate: string;
  endDate: string;
  expectedMemberCount: number;
  acceptsNewMembers: boolean;
  participantLimit?: number;
  recruitmentPositions?: string | null;
  personalProject: boolean;
  parentActivityId?: string;
  initialMemberIds: string[];
}

export interface ActivityOpeningRequestResponse {
  id: string;
  applicant: UserSummaryDto;
  title: string;
  description: string;
  operationPlan: string;
  activityType: ActivityTypeResponse;
  quarter: QuarterResponse;
  startDate: string;
  endDate: string;
  expectedMemberCount: number;
  acceptsNewMembers: boolean;
  participantLimit?: number | null;
  recruitmentPositions?: string | null;
  personalProject: boolean;
  parentActivityId?: string | null;
  parentActivityTitle?: string | null;
  initialMembers: UserSummaryDto[];
  status: ActivityOpeningRequestStatus;
  reviewer?: UserSummaryDto | null;
  reviewComment?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  approvedActivityId?: string | null;
  createdAt: string;
  modifiedAt: string;
}

export const ACTIVITY_OPENING_STATUS_LABEL: Record<
  ActivityOpeningRequestStatus,
  string
> = {
  DRAFT: "임시 저장",
  SUBMITTED: "검토 대기",
  REVISION_REQUESTED: "보완 요청",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELED: "취소",
};
