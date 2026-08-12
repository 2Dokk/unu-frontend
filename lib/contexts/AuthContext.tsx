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
import { useRouter } from "next/navigation";
import {
  AUTH_STATE_CHANGED_EVENT,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/utils/auth-cookies";

// 30분간 활동이 없으면 자동 로그아웃
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

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

/**
 * JWT 토큰에서 역할 목록을 그대로 추출한다.
 * "ROLE_" 접두사는 떼고 대문자로 정규화한다.
 */
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

/**
 * JWT 토큰에서 가장 높은 권한을 추출
 * 우선순위: ADMIN > MANAGER > MEMBER
 */
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
  const router = useRouter();

  const clearAuthState = useCallback(() => {
    setIsAuthenticated(false);
    setUserRole("GUEST");
    setRoles([]);
    setUserId(null);
    setTokenExpiresAt(null);
  }, []);

  const syncAuthState = useCallback(() => {
    const token = Cookies.get("token");

    if (!token) {
      clearAuthState();
      setIsLoading(false);
      return;
    }

    try {
      const role = extractRoleFromToken(token);

      if (role === "GUEST") {
        clearAuthCookies();
        clearAuthState();
      } else {
        const decoded = jwtDecode<DecodedToken>(token);
        setIsAuthenticated(true);
        setUserRole(role);
        setRoles(extractRolesFromToken(token));
        setUserId(decoded.sub ?? null);
        setTokenExpiresAt(decoded.exp ? decoded.exp * 1000 : null);
      }
    } catch (error) {
      console.error("Auth synchronization error:", error);
      clearAuthCookies();
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState]);

  // 최초 진입과 브라우저 캐시 복원, 다른 탭에서의 인증 변경을 함께 반영한다.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncAuthState();
    };

    syncAuthState();
    window.addEventListener("focus", syncAuthState);
    window.addEventListener("pageshow", syncAuthState);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncAuthState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncAuthState);
      window.removeEventListener("pageshow", syncAuthState);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncAuthState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncAuthState]);

  const login = (token: string, refreshToken?: string) => {
    setAuthCookies(token, refreshToken);

    const role = extractRoleFromToken(token);
    const decoded = jwtDecode<DecodedToken>(token);
    setIsAuthenticated(true);
    setUserRole(role);
    setRoles(extractRolesFromToken(token));
    setUserId(decoded.sub ?? null);
    setTokenExpiresAt(decoded.exp ? decoded.exp * 1000 : null);
  };

  const clearSession = useCallback(() => {
    clearAuthCookies();
    clearAuthState();
  }, [clearAuthState]);

  const logout = useCallback(() => {
    clearSession();

    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  }, [clearSession]);

  const expireSession = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  useEffect(() => {
    if (!isAuthenticated || tokenExpiresAt === null) return;

    const timer = window.setTimeout(
      expireSession,
      Math.max(0, tokenExpiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [expireSession, isAuthenticated, tokenExpiresAt]);

  // 비활동 자동 로그아웃
  useEffect(() => {
    if (!isAuthenticated) return;

    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(expireSession, IDLE_TIMEOUT_MS);
    };

    IDLE_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      IDLE_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [expireSession, isAuthenticated]);

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
