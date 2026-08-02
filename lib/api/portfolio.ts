import {
  PortfolioListResponse,
  PortfolioResponse,
  PortfolioRequest,
} from "@/lib/interfaces/portfolio";
import publicClient from "./publicClient";
import axiosInstance from "./axiosInstance";

export async function getPortfolios(): Promise<PortfolioListResponse> {
  return publicClient.get<PortfolioListResponse>("/public/portfolios");
}

export async function getPortfolioById(
  id: string,
): Promise<PortfolioResponse | null> {
  return publicClient.get<PortfolioResponse>(`/public/portfolios/${id}`);
}

export async function createPortfolio(
  data: PortfolioRequest,
): Promise<PortfolioResponse> {
  const response = await axiosInstance.post<PortfolioResponse>(
    "/portfolios",
    data,
  );
  return response.data;
}

export async function updatePortfolio(
  id: string,
  data: PortfolioRequest,
): Promise<PortfolioResponse> {
  const response = await axiosInstance.put<PortfolioResponse>(
    `/portfolios/${id}`,
    data,
  );
  return response.data;
}

export async function deletePortfolio(id: string): Promise<void> {
  await axiosInstance.delete(`/portfolios/${id}`);
}

export async function setPortfolioPinned(
  id: string,
  pinned: boolean,
): Promise<PortfolioResponse> {
  const response = await axiosInstance.patch<PortfolioResponse>(
    `/portfolios/${id}/pin?pinned=${pinned}`,
  );
  return response.data;
}
