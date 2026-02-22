import { ActivityParticipantResponse } from "./activity-participant";
import { ActivitySessionResponseDto } from "./activity-session";

export interface AttendanceRequestDto {
  sessionId: string;
  participantId: string;
  status: string;
}

export interface AttendanceResponseDto {
  session: ActivitySessionResponseDto;
  participant: ActivityParticipantResponse;
  status: string;
}

export interface AttendanceBulkRequestDto {
  sessionId: string;
  presentParticipantIds: string[];
  absentParticipantIds: string[];
  excusedParticipantIds: string[];
}

export interface AttendanceStatsResponseDto {
  presentCount: number;
  absentCount: number;
  excusedCount: number;
}
