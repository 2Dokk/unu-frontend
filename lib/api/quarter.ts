import { QuarterRequest, QuarterResponse } from "../interfaces/quarter";
import axiosInstance from "./axiosInstance";
import publicClient from "./publicClient";

export async function getCurrentQuarter(): Promise<QuarterResponse> {
  return publicClient.get<QuarterResponse>("/public/current-quarter");
}

export async function updateCurrentQuarter(data: {
  quarterId: string;
}): Promise<QuarterResponse> {
  const response = await axiosInstance.put<QuarterResponse>(
    "/current-quarter",
    data,
  );
  return response.data;
}

export async function getAllQuarters(): Promise<QuarterResponse[]> {
  return publicClient.get<QuarterResponse[]>("/public/quarters");
}

export async function getQuarterById(
  quarterId: string,
): Promise<QuarterResponse> {
  return publicClient.get<QuarterResponse>(`/public/quarters/${quarterId}`);
}

export async function createQuarter(
  data: QuarterRequest,
): Promise<QuarterResponse> {
  const response = await axiosInstance.post<QuarterResponse>("/quarters", data);
  return response.data;
}

export async function updateQuarter(
  quarterId: string,
  data: QuarterRequest,
): Promise<QuarterResponse> {
  const response = await axiosInstance.put<QuarterResponse>(
    `/quarters/${quarterId}`,
    data,
  );
  return response.data;
}

export async function deleteQuarter(quarterId: string): Promise<void> {
  await axiosInstance.delete(`/quarters/${quarterId}`);
}

export async function searchQuarters(
  year: number,
  season: string,
): Promise<QuarterResponse[]> {
  const response = await axiosInstance.get<QuarterResponse[]>(
    "/quarters/search",
    {
      params: { year, season },
    },
  );
  return response.data;
}
