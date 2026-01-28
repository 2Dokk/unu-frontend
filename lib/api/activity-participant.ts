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
  id: number,
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
  id: number,
  data: ActivityParticipantRequest,
): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.patch<ActivityParticipantResponse>(
    `/activity-participants/${id}/status`,
    data,
  );
  return response.data;
}

export async function updateActivityParticipantCompleted(
  id: number,
): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.patch<ActivityParticipantResponse>(
    `/activity-participants/${id}/completed`,
  );
  return response.data;
}

export async function updateActivityParticipant(
  id: number,
  data: ActivityParticipantRequest,
): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.put<ActivityParticipantResponse>(
    `/activity-participants/${id}`,
    data,
  );
  return response.data;
}

export async function deleteActivityParticipant(id: number): Promise<void> {
  await axiosInstance.delete(`/activity-participants/${id}`);
}

export async function getMyParticipantByActivityId(
  activityId: number,
): Promise<ActivityParticipantResponse | null> {
  try {
    const response = await axiosInstance.get<ActivityParticipantResponse>(
      `/activity-participants/activities/${activityId}/me`,
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function createMyParticipantByActivityId(data: {
  activityId: number;
}): Promise<ActivityParticipantResponse> {
  const response = await axiosInstance.post<ActivityParticipantResponse>(
    `/activity-participants/activities/${data.activityId}/me`,
  );
  return response.data;
}
