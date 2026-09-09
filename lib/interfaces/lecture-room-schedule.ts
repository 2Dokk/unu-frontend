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

export interface LectureRoomScheduleImportSlot {
  dayOfWeek: string;
  period: number;
}

export interface LectureRoomScheduleImportUser {
  studentId: string;
  slots: LectureRoomScheduleImportSlot[];
}

export interface LectureRoomScheduleImportRequestDto {
  quarterId: string;
  users: LectureRoomScheduleImportUser[];
}

export interface LectureRoomScheduleImportResponseDto {
  userCount: number;
  deletedCount: number;
  createdCount: number;
}
