import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp?: number;
  sub?: string;
  roles?: string[];
}

function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function hasAnyRole(token: string, requiredRoles: string[]): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return (decoded.roles ?? []).some((role) =>
      requiredRoles.includes(role.toUpperCase().replace(/^ROLE_/, "")),
    );
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token || !isTokenValid(token)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "redirect",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (
    request.nextUrl.pathname.startsWith("/manage/lecture-room") &&
    !hasAnyRole(token, ["ADMIN", "MANAGER", "LECTURE_ROOM_MANAGER"])
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (
    request.nextUrl.pathname.startsWith("/manage/interviews") &&
    !hasAnyRole(token, ["ADMIN", "MANAGER"])
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/manage/:path*",
    "/admin/:path*",
    "/home",
    "/home/:path*",
    "/profile",
    "/activities/:path*",
    "/activity-opening/:path*",
    "/lecture-materials",
    "/online-lecture",
  ],
};
