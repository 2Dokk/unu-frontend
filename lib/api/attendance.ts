import axiosInstance from "./axiosInstance";
import {
  AttendanceRequestDto,
  AttendanceResponseDto,
  AttendanceBulkRequestDto,
  AttendanceStatsResponseDto,
} from "../interfaces/attendance";

/**
 * Get all attendances
 */
export const getAllAttendances = async (): Promise<AttendanceResponseDto[]> => {
  const response =
    await axiosInstance.get<AttendanceResponseDto[]>("/attendances");
  return response.data;
};

/**
 * Create a new attendance
 */
export const createAttendance = async (
  data: AttendanceRequestDto,
): Promise<AttendanceResponseDto> => {
  const response = await axiosInstance.post<AttendanceResponseDto>(
    "/attendances",
    data,
  );
  return response.data;
};

/**
 * Bulk create attendances
 */
export const bulkCreateAttendances = async (
  data: AttendanceBulkRequestDto,
): Promise<AttendanceResponseDto[]> => {
  const response = await axiosInstance.post<AttendanceResponseDto[]>(
    "/attendances/bulk",
    data,
  );
  return response.data;
};

export const bulkUpdateAttendances = async (
  data: AttendanceBulkRequestDto,
): Promise<AttendanceResponseDto[]> => {
  const response = await axiosInstance.patch<AttendanceResponseDto[]>(
    "/attendances/bulk",
    data,
  );
  return response.data;
};

/**
 * Get attendance by ID
 */
export const getAttendanceById = async (
  id: string,
): Promise<AttendanceResponseDto> => {
  const response = await axiosInstance.get<AttendanceResponseDto>(
    `/attendances/${id}`,
  );
  return response.data;
};

/**
 * Update attendance by ID
 */
export const updateAttendance = async (
  id: string,
  data: AttendanceRequestDto,
): Promise<AttendanceResponseDto> => {
  const response = await axiosInstance.put<AttendanceResponseDto>(
    `/attendances/${id}`,
    data,
  );
  return response.data;
};

/**
 * Delete attendance by ID
 */
export const deleteAttendance = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/attendances/${id}`);
};

/**
 * Get all attendances by session ID
 */
export const getAttendancesBySessionId = async (
  sessionId: string,
): Promise<AttendanceResponseDto[]> => {
  const response = await axiosInstance.get<AttendanceResponseDto[]>(
    `/attendances/sessions/${sessionId}`,
  );
  return response.data;
};

/**
 * Get all attendances by participant ID
 */
export const getAttendancesByParticipantId = async (
  participantId: string,
): Promise<AttendanceResponseDto[]> => {
  const response = await axiosInstance.get<AttendanceResponseDto[]>(
    `/attendances/participants/${participantId}`,
  );
  return response.data;
};

/**
 * Get attendance statistics by participant ID
 */
export const getAttendanceStatsByParticipantId = async (
  participantId: string,
): Promise<AttendanceStatsResponseDto> => {
  const response = await axiosInstance.get<AttendanceStatsResponseDto>(
    `/attendances/stats/participants/${participantId}`,
  );
  return response.data;
};
