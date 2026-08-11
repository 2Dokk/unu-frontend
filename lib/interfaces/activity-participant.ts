import { ActivityResponse } from "./activity";
import { UserResponseDto } from "./auth";

export interface ActivityParticipantResponse {
  id: string; // UUID
  userId: string; // UUID
  status: "APPLIED" | "APPROVED" | "REJECTED";
  completed: boolean;
  createdAt: string;
  modifiedAt: string;
  activity: ActivityResponse;
  user: UserResponseDto;
}

export interface ActivityParticipantRequest {
  activityId: string;
  userId?: string;
  status?: "APPLIED" | "APPROVED" | "REJECTED";
}

export interface ActivityJoinRequest {
  refundBankName: string;
  refundAccountNumber: string;
  refundAccountHolder: string;
  agreedToDepositPolicy: boolean;
  confirmedDepositPayment: boolean;
  agreedToPromotion: boolean;
}

export interface ActivityParticipantRefundAccount {
  participantId: string;
  userId: string;
  userName: string;
  studentId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  paymentConfirmedAt: string;
}

export interface ActivityParticipantSummary {
  id: string;
  name: string;
}

export const ACTIVITY_PARTICIPANT_STATUS_MAP: Record<string, string> = {
  APPLIED: "신청됨",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
};
