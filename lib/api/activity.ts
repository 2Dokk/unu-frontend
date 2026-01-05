import { ActivityRequest, ActivityResponse } from "../interfaces/activity";
import axiosInstance from "./axiosInstance";

export async function getAllActivities(): Promise<ActivityResponse[]> {
  const response = await axiosInstance.get<ActivityResponse[]>(
    "/activity-types"
  );
  return response.data;
}

export async function getActivityById(
  activityId: number
): Promise<ActivityResponse> {
  const response = await axiosInstance.get<ActivityResponse>(
    `/activity-types/${activityId}`
  );
  return response.data;
}

export async function createActivity(
  data: ActivityRequest
): Promise<ActivityResponse> {
  const response = await axiosInstance.post<ActivityResponse>(
    "/Activitys",
    data
  );
  return response.data;
}

export async function updateActivity(
  activityId: number,
  data: ActivityRequest
): Promise<ActivityResponse> {
  const response = await axiosInstance.put<ActivityResponse>(
    `/activity-types/${activityId}`,
    data
  );
  return response.data;
}

export async function deleteActivity(activityId: number): Promise<void> {
  await axiosInstance.delete(`/activity-types/${activityId}`);
}

export interface ActivitySearchParams {
  title?: string;
  status?: string;
  activityTypeId?: string;
  quarterId?: string;
}

export async function searchActivities(
  params: ActivitySearchParams
): Promise<ActivityResponse[]> {
  const response = await axiosInstance.get<ActivityResponse[]>(
    "/activities/search",
    { params }
  );
  return response.data;
}
