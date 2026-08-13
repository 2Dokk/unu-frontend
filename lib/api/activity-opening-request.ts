import axiosInstance from "./axiosInstance";
import { UserSummaryDto } from "../interfaces/auth";
import {
  ActivityOpeningRequestPayload,
  ActivityOpeningRequestResponse,
  ActivityOpeningRequestStatus,
} from "../interfaces/activity-opening-request";

const BASE_PATH = "/activity-opening-requests";
const MANAGE_PATH = "/manage/activity-opening-requests";

export async function createActivityOpeningRequest(
  data: ActivityOpeningRequestPayload,
): Promise<ActivityOpeningRequestResponse> {
  const response = await axiosInstance.post<ActivityOpeningRequestResponse>(
    BASE_PATH,
    data,
  );
  return response.data;
}

export async function updateActivityOpeningRequest(
  id: string,
  data: ActivityOpeningRequestPayload,
): Promise<ActivityOpeningRequestResponse> {
  const response = await axiosInstance.put<ActivityOpeningRequestResponse>(
    `${BASE_PATH}/${id}`,
    data,
  );
  return response.data;
}

export async function submitActivityOpeningRequest(
  id: string,
): Promise<ActivityOpeningRequestResponse> {
  const response = await axiosInstance.post<ActivityOpeningRequestResponse>(
    `${BASE_PATH}/${id}/submit`,
  );
  return response.data;
}

export async function cancelActivityOpeningRequest(
  id: string,
): Promise<ActivityOpeningRequestResponse> {
  const response = await axiosInstance.post<ActivityOpeningRequestResponse>(
    `${BASE_PATH}/${id}/cancel`,
  );
  return response.data;
}

export async function getMyActivityOpeningRequests(): Promise<
  ActivityOpeningRequestResponse[]
> {
  const response = await axiosInstance.get<ActivityOpeningRequestResponse[]>(
    `${BASE_PATH}/me`,
  );
  return response.data;
}

export async function getActivityOpeningRequest(
  id: string,
): Promise<ActivityOpeningRequestResponse> {
  const response = await axiosInstance.get<ActivityOpeningRequestResponse>(
    `${BASE_PATH}/${id}`,
  );
  return response.data;
}

export async function searchActivityOpeningMembers(
  query: string,
): Promise<UserSummaryDto[]> {
  const response = await axiosInstance.get<UserSummaryDto[]>(
    `${BASE_PATH}/members/search`,
    { params: { query } },
  );
  return response.data;
}

export async function getActivityOpeningRequestsForManagement(): Promise<
  ActivityOpeningRequestResponse[]
> {
  const response = await axiosInstance.get<ActivityOpeningRequestResponse[]>(
    MANAGE_PATH,
  );
  return response.data;
}

export async function getActivityOpeningRequestForManagement(
  id: string,
): Promise<ActivityOpeningRequestResponse> {
  const response = await axiosInstance.get<ActivityOpeningRequestResponse>(
    `${MANAGE_PATH}/${id}`,
  );
  return response.data;
}

export async function reviewActivityOpeningRequest(
  id: string,
  status: Extract<
    ActivityOpeningRequestStatus,
    "REVISION_REQUESTED" | "REJECTED"
  >,
  comment: string,
): Promise<ActivityOpeningRequestResponse> {
  const response = await axiosInstance.patch<ActivityOpeningRequestResponse>(
    `${MANAGE_PATH}/${id}/review`,
    { status, comment },
  );
  return response.data;
}

export async function approveActivityOpeningRequest(
  id: string,
  data: {
    comment?: string;
    depositAmount?: number;
  },
): Promise<ActivityOpeningRequestResponse> {
  const response =
    await axiosInstance.post<ActivityOpeningRequestResponse>(
      `${MANAGE_PATH}/${id}/approve`,
      data,
    );

  return response.data;
}
