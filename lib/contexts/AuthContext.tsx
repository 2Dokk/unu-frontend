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
