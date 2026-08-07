"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface DecodedToken {
  sub?: string;
  email?: string;
  roles?: string[];
  exp?: number;
  [key: string]: any;
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
  } catch (error: any) {
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
  const router = useRouter();

  // 초기 인증 상태 확인
  useEffect(() => {
    const initAuth = () => {
      const token = Cookies.get("token");

      if (!token) {
        setIsAuthenticated(false);
        setUserRole("GUEST");
        setRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        const role = extractRoleFromToken(token);

        if (role === "GUEST") {
          // 토큰이 만료되었거나 유효하지 않음
          Cookies.remove("token");
          Cookies.remove("refreshToken");
          setIsAuthenticated(false);
          setUserRole("GUEST");
          setRoles([]);
          setUserId(null);
        } else {
          const decoded = jwtDecode<DecodedToken>(token);
          setIsAuthenticated(true);
          setUserRole(role);
          setRoles(extractRolesFromToken(token));
          setUserId(decoded.sub ?? null);
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        setIsAuthenticated(false);
        setUserRole("GUEST");
        setRoles([]);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, refreshToken?: string) => {
    Cookies.set("token", token, { expires: 7 }); // 7일
    if (refreshToken) {
      Cookies.set("refreshToken", refreshToken, { expires: 30 }); // 30일
    }

    const role = extractRoleFromToken(token);
    const decoded = jwtDecode<DecodedToken>(token);
    setIsAuthenticated(true);
    setUserRole(role);
    setRoles(extractRolesFromToken(token));
    setUserId(decoded.sub ?? null);
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    setIsAuthenticated(false);
    setUserRole("GUEST");
    setRoles([]);
    setUserId(null);

    if (typeof window !== "undefined") {
      router.push("/login");
    }
  };

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
