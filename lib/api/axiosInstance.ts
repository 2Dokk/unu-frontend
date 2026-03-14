import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
// ...existing code...

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: any) => {
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

// --- token refresh middleware (response interceptor) ---
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
  isRefreshing = false;
};

// create a plain axios instance to call refresh endpoint (to avoid interceptor loop)
const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    const originalRequest = error.config;

    // if no response or not 401, just reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // prevent infinite loop when refresh endpoint itself returns 401
    if (originalRequest && originalRequest._retry) {
      // already retried -> logout
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    // if no refresh token, logout immediately
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) {
      Cookies.remove("token");
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // queue the request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // start refresh
    originalRequest._retry = true;
    isRefreshing = true;

    return new Promise((resolve, reject) => {
      // adjust refresh endpoint / payload according to your backend
      refreshClient
        .post("/auth/refresh", { refreshToken })
        .then((res) => {
          const data = res.data || {};
          const newAccessToken = data.accessToken || data.token;
          const newRefreshToken = data.refreshToken;

          if (!newAccessToken) {
            throw new Error("No access token in refresh response");
          }

          // store tokens (adjust options as needed: expires, secure, sameSite)
          Cookies.set("token", newAccessToken);
          if (newRefreshToken) Cookies.set("refreshToken", newRefreshToken);

          // update default header for subsequent requests
          axiosInstance.defaults.headers["Authorization"] =
            `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          resolve(axiosInstance(originalRequest));
        })
        .catch((err) => {
          processQueue(err, null);
          Cookies.remove("token");
          Cookies.remove("refreshToken");
          if (typeof window !== "undefined") window.location.href = "/login";
          reject(err);
        });
    });
  },
);

export default axiosInstance;
