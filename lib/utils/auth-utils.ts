import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub?: string;
  email?: string;
  role?: string;
  roles?: string[];
  exp?: number;
  [key: string]: any;
}

export function getAuthToken(): string | undefined {
  return Cookies.get("token");
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getUserRole(): "admin" | "member" | "anonymous" {
  const token = getAuthToken();
  if (!token) return "anonymous";

  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // Check various possible role formats
    const role = decoded.role || decoded.roles?.[0];

    if (
      role &&
      (role.toLowerCase() === "admin" || role.toLowerCase() === "role_admin")
    ) {
      return "admin";
    }

    return "member";
  } catch {
    return "anonymous";
  }
}

export function logout() {
  Cookies.remove("token");
  Cookies.remove("refreshToken");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
