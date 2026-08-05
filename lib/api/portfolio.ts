import {
  PortfolioListResponse,
  PortfolioResponse,
  PortfolioRequest,
} from "@/lib/interfaces/portfolio";
import publicClient, { ApiError } from "./publicClient";
import axiosInstance from "./axiosInstance";

const CACHE_TTL_MS = 60_000;

interface CacheEntry<T> {
  value: T;
  storedAt: number;
}

let portfolioListCache: CacheEntry<PortfolioListResponse> | undefined;
let portfolioListRequest: Promise<PortfolioListResponse> | undefined;
const portfolioCache = new Map<string, CacheEntry<PortfolioResponse>>();
const portfolioRequests = new Map<string, Promise<PortfolioResponse | null>>();
let portfolioCacheGeneration = 0;

function isFresh<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.storedAt < CACHE_TTL_MS;
}

function cachePortfolio(portfolio: PortfolioResponse, storedAt = Date.now()) {
  portfolioCache.set(portfolio.id, { value: portfolio, storedAt });
}

function invalidatePortfolioList() {
  portfolioCacheGeneration += 1;
  portfolioListCache = undefined;
  portfolioListRequest = undefined;
  portfolioRequests.clear();
}

export function getCachedPortfolios(): PortfolioListResponse | undefined {
  return portfolioListCache?.value;
}

export function getCachedPortfolioById(
  id: string,
): PortfolioResponse | undefined {
  return portfolioCache.get(id)?.value;
}

export async function getPortfolios(): Promise<PortfolioListResponse> {
  if (isFresh(portfolioListCache)) return portfolioListCache.value;
  if (portfolioListRequest) return portfolioListRequest;

  const requestGeneration = portfolioCacheGeneration;
  const request = publicClient
    .get<PortfolioListResponse>("/public/portfolios")
    .then((value) => {
      if (requestGeneration === portfolioCacheGeneration) {
        const storedAt = Date.now();
        portfolioListCache = { value, storedAt };
        value.portfolios.forEach((portfolio) =>
          cachePortfolio(portfolio, storedAt),
        );
      }
      return value;
    })
    .finally(() => {
      if (portfolioListRequest === request) portfolioListRequest = undefined;
    });

  portfolioListRequest = request;
  return request;
}

export async function getPortfolioById(
  id: string,
): Promise<PortfolioResponse | null> {
  const cached = portfolioCache.get(id);
  if (isFresh(cached)) return cached.value;

  const pending = portfolioRequests.get(id);
  if (pending) return pending;

  const requestGeneration = portfolioCacheGeneration;
  const request = publicClient
    .get<PortfolioResponse>(`/public/portfolios/${id}`)
    .then((portfolio) => {
      if (requestGeneration === portfolioCacheGeneration) {
        cachePortfolio(portfolio);
      }
      return portfolio;
    })
    .catch((error) => {
      if (error instanceof ApiError && error.status === 404) {
        portfolioCache.delete(id);
        return null;
      }
      throw error;
    })
    .finally(() => {
      if (portfolioRequests.get(id) === request) {
        portfolioRequests.delete(id);
      }
    });

  portfolioRequests.set(id, request);
  return request;
}

export async function createPortfolio(
  data: PortfolioRequest,
): Promise<PortfolioResponse> {
  const response = await axiosInstance.post<PortfolioResponse>(
    "/portfolios",
    data,
  );
  invalidatePortfolioList();
  cachePortfolio(response.data);
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
  invalidatePortfolioList();
  cachePortfolio(response.data);
  return response.data;
}

export async function deletePortfolio(id: string): Promise<void> {
  await axiosInstance.delete(`/portfolios/${id}`);
  invalidatePortfolioList();
  portfolioCache.delete(id);
}

export async function setPortfolioPinned(
  id: string,
  pinned: boolean,
): Promise<PortfolioResponse> {
  const response = await axiosInstance.patch<PortfolioResponse>(
    `/portfolios/${id}/pin?pinned=${pinned}`,
  );
  invalidatePortfolioList();
  cachePortfolio(response.data);
  return response.data;
}
