import { Notice, NoticeListResponse, NoticeRequest } from "@/lib/interfaces/notice";
import publicClient from "./publicClient";
import axiosInstance from "./axiosInstance";

export async function getPublicNotices(limit?: number): Promise<NoticeListResponse> {
  const path = limit ? `/public/notices?limit=${limit}` : "/public/notices";
  return publicClient.get<NoticeListResponse>(path);
}

export async function getPublicNoticeById(id: string): Promise<Notice> {
  return publicClient.get<Notice>(`/public/notices/${id}`);
}

export async function getNotices(): Promise<NoticeListResponse> {
  const response = await axiosInstance.get<NoticeListResponse>("/notices");
  return response.data;
}

export async function createNotice(data: NoticeRequest): Promise<Notice> {
  const response = await axiosInstance.post<Notice>("/notices", data);
  return response.data;
}

export async function updateNotice(id: string, data: NoticeRequest): Promise<Notice> {
  const response = await axiosInstance.put<Notice>(`/notices/${id}`, data);
  return response.data;
}

export async function deleteNotice(id: string): Promise<void> {
  await axiosInstance.delete(`/notices/${id}`);
}
