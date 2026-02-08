import {
  RecruitmentRequest,
  RecruitmentResponse,
} from "../interfaces/recruitment";
import axiosInstance from "./axiosInstance";

export async function getAllRecruitments(): Promise<RecruitmentResponse[]> {
  const response =
    await axiosInstance.get<RecruitmentResponse[]>("/recruitments");
  return response.data;
}

export async function getRecruitmentById(
  id: number,
): Promise<RecruitmentResponse> {
  const response = await axiosInstance.get<RecruitmentResponse>(
    `/public/recruitments/${id}`,
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
  return response.data;
}

export async function updateRecruitment(
  id: number,
  data: RecruitmentRequest,
): Promise<RecruitmentResponse> {
  const response = await axiosInstance.patch<RecruitmentResponse>(
    `/recruitments/${id}`,
    data,
  );
  return response.data;
}

export async function deleteRecruitment(id: number): Promise<void> {
  await axiosInstance.delete(`/recruitments/${id}`);
}

export async function getActiveRecruitment(): Promise<RecruitmentResponse> {
  const response = await axiosInstance.get<RecruitmentResponse>(
    `/public/recruitments/active`,
  );
  return response.data;
}
