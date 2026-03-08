import {
  ActivityParticipantRequest,
  ActivityParticipantResponse,
} from "../interfaces/activity-participant";
import axiosInstance from "./axiosInstance";

export async function getAllActivityParticipants(): Promise<
  ActivityParticipantResponse[]
> {
  const response = await axiosInstance.get<ActivityParticipantResponse[]>(
    "/activity-participants",
  );
  return response.data;
}

export async function getActivityParticipantById(
  id: string,
): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.get<ActivityParticipantResponse>(
    `/activity-participants/${id}`,
  );
  return response.data;
}

export async function createActivityParticipant(
  data: ActivityParticipantRequest,
): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.post<ActivityParticipantResponse>(
    "/activity-participants",
    data,
  );
  return response.data;
}

export async function updateActivityParticipantStatus(
  id: string,
  data: ActivityParticipantRequest,
): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.patch<ActivityParticipantResponse>(
    `/activity-participants/${id}/status`,
    data,
  );
  return response.data;
}

export async function updateActivityParticipantCompleted(
  id: string,
): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.patch<ActivityParticipantResponse>(
    `/activity-participants/${id}/completed`,
  );
  return response.data;
}

export async function updateActivityParticipant(
  id: string,
  data: ActivityParticipantRequest,
): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.put<ActivityParticipantResponse>(
    `/activity-participants/${id}`,
    data,
  );
  return response.data;
}

export async function deleteActivityParticipant(id: string): Promise<void> {
  await axiosInstance.delete(`/activity-participants/${id}`);
}

export async function getMyParticipantByActivityId(
  activityId: string,
): Promise<ActivityParticipantResponse | null> {
  try {
    const response = await axiosInstance.get<ActivityParticipantResponse>(
      `/activity-participants/activities/${activityId}/me`,
    );
    return response.data;
  } catch (error: any) {
    return null;
  }
}

export async function createMyParticipantByActivityId(data: {
  activityId: string;
}): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.post<ActivityParticipantResponse>(
    `/activity-participants/activities/${data.activityId}/me`,
  );
  return response.data;
}

export async function getActivityParticipantsByUserId(data: {
  userId: string;
}): Promise<ActivityParticipantResponse[]> {
  const response = await axiosInstance.get<ActivityParticipantResponse[]>(
    `/activity-participants/users/${data.userId}`,
  );
  return response.data;
}

export async function getActivityParticipantsByActivityId(data: {
  activityId: string;
}): Promise<ActivityParticipantResponse[]> {
  const response = await axiosInstance.get<ActivityParticipantResponse[]>(
    `/activity-participants/activities/${data.activityId}`,
  );
  return response.data;
}

export async function getMyActivityParticipants(): Promise<
  ActivityParticipantResponse[]
> {
  const response = await axiosInstance.get<ActivityParticipantResponse[]>(
    "/activity-participants/me",
  );
  return response.data;
}
