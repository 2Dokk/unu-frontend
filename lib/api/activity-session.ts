import axiosInstance from "./axiosInstance";
import {
  ActivitySessionRequestDto,
  ActivitySessionResponseDto,
} from "../interfaces/activity-session";

/**
 * Get all activity sessions
 */
export const getAllActivitySessions = async (): Promise<
  ActivitySessionResponseDto[]
> => {
  const response =
    await axiosInstance.get<ActivitySessionResponseDto[]>("/activity-sessions");
  return response.data;
};

/**
 * Create a new activity session
 */
export const createActivitySession = async (
  data: ActivitySessionRequestDto,
): Promise<ActivitySessionResponseDto> => {
  const response = await axiosInstance.post<ActivitySessionResponseDto>(
    "/activity-sessions",
    data,
  );
  return response.data;
};

/**
 * Get activity session by ID
 */
export const getActivitySessionById = async (
  id: number,
): Promise<ActivitySessionResponseDto> => {
  const response = await axiosInstance.get<ActivitySessionResponseDto>(
    `/activity-sessions/${id}`,
  );
  return response.data;
};

/**
 * Update activity session by ID
 */
export const updateActivitySession = async (
  id: number,
  data: ActivitySessionRequestDto,
): Promise<ActivitySessionResponseDto> => {
  const response = await axiosInstance.put<ActivitySessionResponseDto>(
    `/activity-sessions/${id}`,
    data,
  );
  return response.data;
};

/**
 * Delete activity session by ID
 */
export const deleteActivitySession = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/activity-sessions/${id}`);
};

/**
 * Get all activity sessions by activity ID
 */
export const getActivitySessionsByActivityId = async (
  activityId: number,
): Promise<ActivitySessionResponseDto[]> => {
  const response = await axiosInstance.get<ActivitySessionResponseDto[]>(
    `/activity-sessions/activities/${activityId}`,
  );
  return response.data;
};
