import { AuditorDto } from "./auth";

export interface LectureRoomScheduleRequestDto {
  quarterId: string;
  dayOfWeek: string;
  timeSlot: string; // "HH:mm:ss"
  userId?: string;
}

export interface LectureRoomScheduleResponseDto {
  id: string;
  quarterId: string;
  quarterName: string;
  dayOfWeek: string;
  timeSlot: string; // "HH:mm:ss"
  userId: string;
  userName: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: AuditorDto;
  modifiedBy: AuditorDto;
}
