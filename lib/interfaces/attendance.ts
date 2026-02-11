import { ActivityParticipantResponse } from "./activity-participant";
import { ActivitySessionResponseDto } from "./activity-session";

export interface AttendanceRequestDto {
  sessionId: number;
  participantId: number;
  status: string;
}

export interface AttendanceResponseDto {
  session: ActivitySessionResponseDto;
  participant: ActivityParticipantResponse;
  status: string;
}

export interface AttendanceBulkRequestDto {
  sessionId: number;
  presentParticipantIds: number[];
  absentParticipantIds: number[];
  excusedParticipantIds: number[];
}

export interface AttendanceStatsResponseDto {
  presentCount: number;
  absentCount: number;
  excusedCount: number;
}
