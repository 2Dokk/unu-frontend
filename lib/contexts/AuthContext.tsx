"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  isRefreshSessionExpiredError,
  refreshAccessToken,
} from "@/lib/api/axiosInstance";
import {
  AUTH_STATE_CHANGED_EVENT,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/utils/auth-cookies";
import {
  beginManualLogout,
  isManualLogoutInProgress,
  markSessionExpired,
  sessionExpiredLoginUrl,
} from "@/lib/utils/auth-session";

const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;
const TOKEN_REFRESH_RETRY_MS = 30 * 1000;

// 미활동 자동 로그아웃: 30분간 입력이 없으면 세션을 만료 처리한다.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 30 * 1000;
const IDLE_STORAGE_THROTTLE_MS = 10 * 1000;
const IDLE_ACTIVITY_KEY = "cnu_last_activity";
const IDLE_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

interface DecodedToken {
  sub?: string;
  email?: string;
  roles?: string[];
  exp?: number;
  [key: string]: unknown;
}

export type UserRole = "ADMIN" | "MANAGER" | "LECTURE_ROOM_MANAGER" | "MEMBER" | "GUEST";

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  /** 토큰에 담긴 모든 역할. userRole과 달리 하나로 접히지 않는다. */
  roles: string[];
  userId: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  getAuthToken: () => string | undefined;
  hasRole: (requiredRole: UserRole) => boolean;
  /** 계층과 무관한 역할(BLOG_MANAGER 등)은 hasRole이 아니라 이쪽으로 검사한다. */
  hasAnyRole: (required: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRolesFromToken(token: string): string[] {
  try {
    const decoded = jwtDecode<DecodedToken>(token);

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return [];
    }

    return (decoded.roles || []).map((r) =>
      r.toUpperCase().replace(/^ROLE_/, ""),
    );
  } catch {
    return [];
  }
}

function isExpiredToken(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return Boolean(decoded.exp && decoded.exp * 1000 < Date.now());
  } catch {
    return false;
  }
}

function extractRoleFromToken(token: string): UserRole {
  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // 토큰 만료 체크
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return "GUEST";
    }

    // roles 배열에서 가장 높은 권한 찾기
    const roles = decoded.roles || [];

    if (
      roles.some(
        (r) => r.toUpperCase() === "ADMIN" || r.toUpperCase() === "ROLE_ADMIN",
      )
    ) {
      return "ADMIN";
    } else if (
      roles.some(
        (r) =>
          r.toUpperCase() === "MANAGER" || r.toUpperCase() === "ROLE_MANAGER",
      )
    ) {
      return "MANAGER";
    } else if (
      roles.some(
        (r) =>
          r.toUpperCase() === "LECTURE_ROOM_MANAGER" ||
          r.toUpperCase() === "ROLE_LECTURE_ROOM_MANAGER",
      )
    ) {
      return "LECTURE_ROOM_MANAGER";
    } else if (
      roles.some(
        (r) =>
          r.toUpperCase() === "MEMBER" || r.toUpperCase() === "ROLE_MEMBER",
      )
    ) {
      return "MEMBER";
    } else if (roles.length > 0) {
      // roles가 있지만 알 수 없는 role인 경우 기본적으로 MEMBER
      return "MEMBER";
    }

    return "GUEST";
  } catch (error) {
    console.error("Failed to decode token:", error);
    return "GUEST";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("GUEST");
  const [roles, setRoles] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setIsAuthenticated(false);
    setUserRole("GUEST");
    setRoles([]);
    setUserId(null);
    setTokenExpiresAt(null);
  }, []);

  const expireSession = useCallback(() => {
    if (isManualLogoutInProgress()) return;
    markSessionExpired();
    clearAuthCookies();
    clearAuthState();
    window.location.replace(sessionExpiredLoginUrl());
  }, [clearAuthState]);

  const applyToken = useCallback((token: string) => {
    const role = extractRoleFromToken(token);
    if (role === "GUEST") return false;

    const decoded = jwtDecode<DecodedToken>(token);
    setIsAuthenticated(true);
    setUserRole(role);
    setRoles(extractRolesFromToken(token));
    setUserId(decoded.sub ?? null);
    setTokenExpiresAt(decoded.exp ? decoded.exp * 1000 : null);
    return true;
  }, []);

  const syncAuthState = useCallback(async () => {
    let token = Cookies.get("token");
    const tokenExpired = Boolean(token && isExpiredToken(token));
    const hasRefreshToken = Boolean(Cookies.get("refreshToken"));

    if ((!token || tokenExpired) && hasRefreshToken) {
      try {
        token = await refreshAccessToken();
      } catch (error) {
        if (isRefreshSessionExpiredError(error)) {
          expireSession();
        }
        setIsLoading(false);
        return;
      }
    }

    if (tokenExpired && !hasRefreshToken) {
      expireSession();
      setIsLoading(false);
      return;
    }

    if (!token) {
      clearAuthState();
      setIsLoading(false);
      return;
    }

    try {
      if (!applyToken(token)) {
        clearAuthCookies();
        clearAuthState();
      }
    } catch (error) {
      console.error("Auth synchronization error:", error);
      clearAuthCookies();
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [applyToken, clearAuthState, expireSession]);

  // 최초 진입과 브라우저 캐시 복원, 다른 탭에서의 인증 변경을 함께 반영한다.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void syncAuthState();
    };
    const handleSync = () => void syncAuthState();

    void syncAuthState();
    window.addEventListener("focus", handleSync);
    window.addEventListener("pageshow", handleSync);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleSync);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("pageshow", handleSync);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleSync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncAuthState]);

  const login = (token: string, refreshToken?: string) => {
    setAuthCookies(token, refreshToken);
    applyToken(token);
  };

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      beginManualLogout();
      clearAuthCookies({ notify: false });
      clearAuthState();
      window.location.replace("/");
    }
  }, [clearAuthState]);

  useEffect(() => {
    if (!isAuthenticated || tokenExpiresAt === null) return;

    let timer: number;
    let disposed = false;

    const renewSession = async () => {
      try {
        const token = await refreshAccessToken();
        if (!disposed) applyToken(token);
      } catch (error) {
        if (disposed || isManualLogoutInProgress()) return;
        if (isRefreshSessionExpiredError(error)) {
          expireSession();
          return;
        }
        timer = window.setTimeout(renewSession, TOKEN_REFRESH_RETRY_MS);
      }
    };

    timer = window.setTimeout(
      renewSession,
      Math.max(0, tokenExpiresAt - Date.now() - TOKEN_REFRESH_BUFFER_MS),
    );

    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, [applyToken, expireSession, isAuthenticated, tokenExpiresAt]);

  // 미활동 자동 로그아웃. 입력이 30분간 없으면 세션 만료 파이프라인을 태운다.
  // 탭 간에는 마지막 활동 시각을 localStorage로 공유해, 한 탭에서만 활동해도
  // 다른 탭이 혼자 로그아웃시키지 않도록 한다.
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    const readSharedActivity = (): number => {
      const raw = window.localStorage.getItem(IDLE_ACTIVITY_KEY);
      const parsed = raw ? Number(raw) : 0;
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const writeSharedActivity = (timestamp: number) => {
      try {
        window.localStorage.setItem(IDLE_ACTIVITY_KEY, String(timestamp));
      } catch {
        /* 저장 실패는 무시 — 메모리 기준으로만 판단한다 */
      }
    };

    // 진입(로그인 직후 포함)을 활동으로 본다.
    let lastActivity = Date.now();
    let lastWrite = lastActivity;
    writeSharedActivity(lastActivity);

    const markActivity = () => {
      const now = Date.now();
      lastActivity = now;
      if (now - lastWrite >= IDLE_STORAGE_THROTTLE_MS) {
        lastWrite = now;
        writeSharedActivity(now);
      }
    };

    let stopped = false;
    const checkIdle = () => {
      if (stopped || isManualLogoutInProgress()) return;
      const effectiveLast = Math.max(lastActivity, readSharedActivity());
      if (Date.now() - effectiveLast >= IDLE_TIMEOUT_MS) {
        stopped = true;
        window.clearInterval(interval);
        expireSession();
      }
    };

    const handleVisible = () => {
      if (document.visibilityState === "visible") checkIdle();
    };

    IDLE_EVENTS.forEach((event) =>
      window.addEventListener(event, markActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisible);
    const interval = window.setInterval(checkIdle, IDLE_CHECK_INTERVAL_MS);

    return () => {
      stopped = true;
      IDLE_EVENTS.forEach((event) =>
        window.removeEventListener(event, markActivity),
      );
      document.removeEventListener("visibilitychange", handleVisible);
      window.clearInterval(interval);
    };
  }, [isAuthenticated, expireSession]);

  const getAuthToken = (): string | undefined => {
    return Cookies.get("token");
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy: Record<UserRole, number> = {
      ADMIN: 4,
      MANAGER: 3,
      LECTURE_ROOM_MANAGER: 2,
      MEMBER: 1,
      GUEST: 0,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const hasAnyRole = (required: string[]): boolean =>
    required.some((r) => roles.includes(r.toUpperCase()));

  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    roles,
    userId,
    isLoading,
    login,
    logout,
    getAuthToken,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * AuthContext를 사용하는 커스텀 훅
 * @throws Provider 외부에서 사용 시 에러
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
