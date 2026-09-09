"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { refreshAccessToken } from "@/lib/api/axiosInstance";
import { logout as requestLogout } from "@/lib/api/auth";
import {
  AUTH_STATE_CHANGED_EVENT,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/utils/auth-cookies";
import { beginManualLogout } from "@/lib/utils/auth-session";

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
  login: (token: string) => void;
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
  const [isLoading, setIsLoading] = useState(true);
  // 이번 로드에서 refresh가 이미 실패(복구 불가)로 판정됐는지 기록해, 비로그인/만료 사용자가
  // focus·visibility마다 /auth/refresh를 반복 호출하지 않도록 한다. 로그인 시 초기화된다.
  const sessionAbsentRef = useRef(false);

  const clearAuthState = useCallback(() => {
    setIsAuthenticated(false);
    setUserRole("GUEST");
    setRoles([]);
    setUserId(null);
  }, []);

  const applyToken = useCallback((token: string) => {
    const role = extractRoleFromToken(token);
    if (role === "GUEST") return false;

    const decoded = jwtDecode<DecodedToken>(token);
    setIsAuthenticated(true);
    setUserRole(role);
    setRoles(extractRolesFromToken(token));
    setUserId(decoded.sub ?? null);
    return true;
  }, []);

  const syncAuthState = useCallback(async () => {
    let token = Cookies.get("token");
    const tokenValid = Boolean(token && !isExpiredToken(token));

    // Access Token이 없거나 만료됨 → refresh를 한 번 시도한다.
    // Refresh Token은 HttpOnly 쿠키라 JS에서 존재 여부를 확인할 수 없으므로, 서버 응답으로만 판단한다.
    if (!tokenValid) {
      if (sessionAbsentRef.current) {
        // 이미 이번 로드에서 복구 불가로 판정됨 → 불필요한 refresh 재시도를 막는다.
        clearAuthState();
        setIsLoading(false);
        return;
      }
      try {
        token = await refreshAccessToken();
        sessionAbsentRef.current = false;
      } catch {
        // 세션 만료·미로그인 모두 여기로 온다. 여기서 강제로 로그인 화면으로 보내지 않고
        // 인증 상태만 초기화한다. 보호 경로 redirect는 middleware가, 활성 세션 만료 중
        // API 401 redirect는 axios 인터셉터가 담당한다(공개 페이지의 비로그인 사용자 보호).
        sessionAbsentRef.current = true;
        clearAuthState();
        setIsLoading(false);
        return;
      }
    } else {
      sessionAbsentRef.current = false;
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
  }, [applyToken, clearAuthState]);

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

  const login = (token: string) => {
    // refresh 토큰은 서버가 로그인 응답에서 HttpOnly 쿠키로 설정하므로 프론트에서 저장하지 않는다.
    setAuthCookies(token);
    sessionAbsentRef.current = false;
    applyToken(token);
  };

  const logout = useCallback(async () => {
    if (typeof window === "undefined") return;
    beginManualLogout();
    try {
      // 서버가 HttpOnly refresh 쿠키를 만료시켜 삭제한다.
      await requestLogout();
    } catch {
      // 네트워크 문제 등으로 실패해도 클라이언트 로그아웃은 계속 진행한다.
    } finally {
      // React auth state는 clear하지 않는다. clearAuthState()로 현재 보호 페이지에
      // 중간 GUEST 상태를 노출하면, replace("/") 완료 전에 페이지 인증 effect가
      // /login으로 보내는 경쟁 상태가 생긴다. 어차피 아래 full navigation으로
      // AuthProvider가 새로 초기화되며 토큰이 없어 자연스럽게 GUEST가 된다.
      clearAuthCookies({ notify: false });
      window.location.replace("/");
    }
  }, []);

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
