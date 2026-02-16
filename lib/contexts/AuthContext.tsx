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

export type UserRole = "ADMIN" | "MANAGER" | "MEMBER" | "GUEST";

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  isLoading: boolean;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  getAuthToken: () => string | undefined;
  hasRole: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 초기 인증 상태 확인
  useEffect(() => {
    const initAuth = () => {
      const token = Cookies.get("token");

      if (!token) {
        setIsAuthenticated(false);
        setUserRole("GUEST");
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
        } else {
          setIsAuthenticated(true);
          setUserRole(role);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        setIsAuthenticated(false);
        setUserRole("GUEST");
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
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    setIsAuthenticated(false);
    setUserRole("GUEST");

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
      MEMBER: 2,
      GUEST: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    isLoading,
    login,
    logout,
    getAuthToken,
    hasRole,
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
