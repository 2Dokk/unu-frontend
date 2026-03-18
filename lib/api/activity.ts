import { ActivityRequest, ActivityResponse } from "../interfaces/activity";
import axiosInstance from "./axiosInstance";

export async function getAllActivities(): Promise<ActivityResponse[]> {
  const response =
    await axiosInstance.get<ActivityResponse[]>("/activities");
  return response.data;
}

export async function getActivityById(
  activityId: string,
): Promise<ActivityResponse> {
  const response = await axiosInstance.get<ActivityResponse>(
    `/activities/${activityId}`,
  );
  return response.data;
}

export async function createActivity(
  data: ActivityRequest,
): Promise<ActivityResponse> {
  const response = await axiosInstance.post<ActivityResponse>(
    "/activities",
    data,
  );
  return response.data;
}

export async function createActivityForMe(
  data: ActivityRequest,
): Promise<ActivityResponse> {
  const response = await axiosInstance.post<ActivityResponse>(
    "/activities/me",
    data,
  );
  return response.data;
}

export async function updateActivity(
  activityId: string,
  data: ActivityRequest,
): Promise<ActivityResponse> {
  const response = await axiosInstance.put<ActivityResponse>(
    `/activities/${activityId}`,
    data,
  );
  return response.data;
}

export async function deleteActivity(activityId: string): Promise<void> {
  await axiosInstance.delete(`/activities/${activityId}`);
}

export async function updateActivityStatus(
  activityId: string,
  status: string,
): Promise<ActivityResponse> {
  const response = await axiosInstance.patch<ActivityResponse>(
    `/activities/${activityId}/status`,
    { status },
  );
  return response.data;
}

export interface ActivitySearchParams {
  title?: string;
  status?: string;
  activityTypeId?: string;
  quarterId?: string;
}

export async function searchActivities(
  params: ActivitySearchParams,
): Promise<ActivityResponse[]> {
  const response = await axiosInstance.get<ActivityResponse[]>(
    "/activities/search",
    { params },
  );
  return response.data;
}
