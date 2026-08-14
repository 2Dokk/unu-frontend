import {
  RecruitmentCompletionMessageResponse,
  RecruitmentRequest,
  RecruitmentResponse,
} from "../interfaces/recruitment";
import axiosInstance from "./axiosInstance";
import publicClient from "./publicClient";
import { requestMenuNotificationRefresh } from "@/lib/utils/menu-notification-events";

export async function getAllRecruitments(): Promise<RecruitmentResponse[]> {
  const response =
    await axiosInstance.get<RecruitmentResponse[]>("/recruitments");
  return response.data;
}

export async function getRecruitmentById(
  id: string,
): Promise<RecruitmentResponse> {
  const response = await axiosInstance.get<RecruitmentResponse>(
    `/recruitments/${id}`,
  );
  return response.data;
}

export async function createRecruitment(
  data: RecruitmentRequest,
): Promise<RecruitmentResponse> {
  const response = await axiosInstance.post<RecruitmentResponse>(
    "/recruitments",
    data,
  );
  requestMenuNotificationRefresh();
  return response.data;
}

export async function updateRecruitment(
  id: string,
  data: RecruitmentRequest,
): Promise<RecruitmentResponse> {
  const response = await axiosInstance.put<RecruitmentResponse>(
    `/recruitments/${id}`,
    data,
  );
  return response.data;
}

export async function deleteRecruitment(id: string): Promise<void> {
  await axiosInstance.delete(`/recruitments/${id}`);
}

export async function getActiveRecruitment(): Promise<RecruitmentResponse> {
  return publicClient.get<RecruitmentResponse>(`/public/recruitments/active`);
}

export async function getClosestRecruitment(): Promise<RecruitmentResponse> {
  return publicClient.get<RecruitmentResponse>(`/public/recruitments/closest`);
}

export async function getOperationRecruitments(): Promise<
  RecruitmentResponse[]
> {
  const response = await axiosInstance.get<RecruitmentResponse[]>(
    "/operation-recruitments",
  );
  return response.data;
}

export async function getOperationRecruitmentById(
  id: string,
): Promise<RecruitmentResponse> {
  const response = await axiosInstance.get<RecruitmentResponse>(
    `/operation-recruitments/${id}`,
  );
  return response.data;
}

export async function getOperationRecruitmentCompletionMessage(
  id: string,
): Promise<RecruitmentCompletionMessageResponse> {
  const response =
    await axiosInstance.get<RecruitmentCompletionMessageResponse>(
      `/operation-recruitments/${id}/completion-message`,
    );
  return response.data;
}

export async function getRecruitmentCompletionMessage(
  id: string,
): Promise<RecruitmentCompletionMessageResponse> {
  return publicClient.get<RecruitmentCompletionMessageResponse>(
    `/public/recruitments/${encodeURIComponent(id)}/completion-message`,
  );
}
