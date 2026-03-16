import {
  ActivityTypeRequest,
  ActivityTypeResponse,
} from "../interfaces/activity";
import axiosInstance from "./axiosInstance";

export async function getAllActivityTypes(): Promise<ActivityTypeResponse[]> {
  const response =
    await axiosInstance.get<ActivityTypeResponse[]>("/activity-types");
  return response.data;
}

export async function getActivityTypeById(
  activityTypeId: string,
): Promise<ActivityTypeResponse> {
  const response = await axiosInstance.get<ActivityTypeResponse>(
    `/activity-types/${activityTypeId}`,
  );
  return response.data;
}

export async function createActivityType(
  data: ActivityTypeRequest,
): Promise<ActivityTypeResponse> {
  const response = await axiosInstance.post<ActivityTypeResponse>(
    "/ActivityTypes",
    data,
  );
  return response.data;
}

export async function updateActivityType(
  activityTypeId: string,
  data: ActivityTypeRequest,
): Promise<ActivityTypeResponse> {
  const response = await axiosInstance.put<ActivityTypeResponse>(
    `/activity-types/${activityTypeId}`,
    data,
  );
  return response.data;
}

export async function deleteActivityType(
  activityTypeId: string,
): Promise<void> {
  await axiosInstance.delete(`/activity-types/${activityTypeId}`);
}
