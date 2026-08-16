import axios from "axios";
import Cookies from "js-cookie";
import { clearAuthCookies, setAuthCookies } from "@/lib/utils/auth-cookies";
import {
  isManualLogoutInProgress,
  markSessionExpired,
  sessionExpiredLoginUrl,
} from "@/lib/utils/auth-session";

function redirectToExpiredSessionLogin() {
  if (isManualLogoutInProgress()) return;
  markSessionExpired();
  clearAuthCookies();
  if (typeof window !== "undefined") {
    window.location.replace(sessionExpiredLoginUrl());
  }
}

export class RefreshSessionExpiredError extends Error {
  constructor(message = "Refresh token is unavailable") {
    super(message);
    this.name = "RefreshSessionExpiredError";
  }
}

export function isRefreshSessionExpiredError(error: unknown): boolean {
  if (error instanceof RefreshSessionExpiredError) return true;
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 400 || status === 401 || status === 403;
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 10000,
  // HttpOnly refresh 쿠키가 요청에 자동으로 실리도록 한다.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
// ...existing code...

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: any) => {
    if (isManualLogoutInProgress()) {
      if (config.headers) delete config.headers.Authorization;
      return config;
    }
    const token = Cookies.get("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 10000,
  // refresh 토큰은 HttpOnly 쿠키로만 전달되므로 자격증명을 반드시 함께 보낸다.
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  // refresh 토큰은 JS로 읽지 않는다. 쿠키가 있으면 브라우저가 자동으로 실어 보내고,
  // 없거나 만료됐으면 서버가 401을 반환한다.
  refreshPromise = refreshClient
    .post("/auth/refresh")
    .then((res) => {
      if (isManualLogoutInProgress()) {
        throw new axios.CanceledError("Authentication refresh was canceled");
      }

      const data = res.data || {};
      const newAccessToken = data.accessToken || data.token;
      if (!newAccessToken) {
        throw new RefreshSessionExpiredError("Invalid refresh response");
      }

      setAuthCookies(newAccessToken);
      axiosInstance.defaults.headers.common.Authorization =
        `Bearer ${newAccessToken}`;
      return newAccessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

axiosInstance.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    // if no response or not 401, just reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = String(originalRequest?.url ?? "");
    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/signup")
    ) {
      return Promise.reject(error);
    }

    if (originalRequest && originalRequest._retry) {
      if (!isManualLogoutInProgress()) redirectToExpiredSessionLogin();
      return Promise.reject(error);
    }

    const hadSession = Boolean(Cookies.get("token"));
    originalRequest._retry = true;
    try {
      const newAccessToken = await refreshAccessToken();
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      if (
        hadSession &&
        !isManualLogoutInProgress() &&
        isRefreshSessionExpiredError(refreshError)
      ) {
        redirectToExpiredSessionLogin();
      }
      return Promise.reject(refreshError);
    }
  },
);

export default axiosInstance;
