"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub?: string;
  email?: string;
  roles?: string[];
  exp?: number;
  [key: string]: any;
}

export type UserRole = "ADMIN" | "MANAGER" | "MEMBER" | "GUEST";

/**
 * JWT 토큰의 roles 배열에서 가장 높은 권한을 반환
 * 우선순위: ADMIN > MANAGER > MEMBER
 * 토큰이 없거나 decode 실패 시 GUEST 반환
 */
export function useUserRole(): UserRole {
  const [role, setRole] = useState<UserRole>("GUEST");

  useEffect(() => {
    try {
      const token = Cookies.get("token");

      if (!token) {
        setRole("GUEST");
        return;
      }

      const decoded = jwtDecode<DecodedToken>(token);

      // 토큰 만료 체크
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        setRole("GUEST");
        return;
      }

      // roles 배열에서 가장 높은 권한 찾기
      const roles = decoded.roles || [];

      if (
        roles.some(
          (r) =>
            r.toUpperCase() === "ADMIN" || r.toUpperCase() === "ROLE_ADMIN",
        )
      ) {
        setRole("ADMIN");
      } else if (
        roles.some(
          (r) =>
            r.toUpperCase() === "MANAGER" || r.toUpperCase() === "ROLE_MANAGER",
        )
      ) {
        setRole("MANAGER");
      } else if (
        roles.some(
          (r) =>
            r.toUpperCase() === "MEMBER" || r.toUpperCase() === "ROLE_MEMBER",
        )
      ) {
        setRole("MEMBER");
      } else if (roles.length > 0) {
        // roles가 있지만 알 수 없는 role인 경우 기본적으로 MEMBER
        setRole("MEMBER");
      } else {
        setRole("GUEST");
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
      setRole("GUEST");
    }
  }, []);

  return role;
}

/**
 * 현재 사용자가 특정 role을 가지고 있는지 확인
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const userRole = useUserRole();

  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 4,
    MANAGER: 3,
    MEMBER: 2,
    GUEST: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
