import { QuarterRequest, QuarterResponse } from "../interfaces/quarter";
import axiosInstance from "./axiosInstance";

export async function getCurrentQuarter(): Promise<QuarterResponse> {
  const response = await axiosInstance.get<QuarterResponse>(
    "/public/current-quarter",
  );
  return response.data;
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
  const response =
    await axiosInstance.get<QuarterResponse[]>("/public/quarters");
  return response.data;
}

export async function getQuarterById(
  quarterId: string,
): Promise<QuarterResponse> {
  const response = await axiosInstance.get<QuarterResponse>(
    `/public/quarters/${quarterId}`,
  );
  return response.data;
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
