/**
 * NavigationBar Component
 *
 * A role-aware navigation bar that adapts content based on user authentication state.
 *
 * Features:
 * - Text-based logo: "ItNU | IT and You"
 * - Logo links to different pages based on user role:
 *   - Anonymous: /apply (public recruitment page)
 *   - Member: /activities (member activities)
 *   - Admin: /manage (admin dashboard)
 *
 * Right-side content changes based on user role:
 * - Anonymous: Shows "모집 공고" and "로그인" buttons
 * - Member: Shows current quarter and profile dropdown with "내 페이지" and "로그아웃"
 * - Admin: Shows ADMIN badge and profile dropdown with admin-specific options
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, LogOut, User, Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { useAuth } from "@/lib/contexts/AuthContext";

export function NavigationBar() {
  const router = useRouter();
  const { userRole, logout: handleLogout, isLoading } = useAuth();
  const [currentQuarter, setCurrentQuarter] =
    React.useState<QuarterResponse | null>(null);

  React.useEffect(() => {
    // Fetch current quarter if user is logged in
    if (userRole === "MEMBER" || userRole === "ADMIN") {
      getCurrentQuarter()
        .then(setCurrentQuarter)
        .catch((error) => {
          console.error("Failed to fetch current quarter:", error);
        });
    }
  }, [userRole]);

  const renderRightContent = () => {
    if (isLoading) {
      return null; // Avoid hydration mismatch
    }

    if (userRole === "GUEST") {
      return (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/apply")}
          >
            모집 공고
          </Button>
          <Button size="sm" onClick={() => router.push("/login")}>
            로그인
          </Button>
        </div>
      );
    }

    if (userRole === "MANAGER") {
      return (
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-xs font-semibold">
            MANAGER
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                관리자
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <Shield className="mr-2 h-4 w-4" />
                프로필
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    // MEMBER
    return (
      <div className="flex items-center gap-4">
        {currentQuarter && (
          <div className="hidden sm:block text-sm font-medium text-muted-foreground">
            {currentQuarter.year} {currentQuarter.season.toUpperCase()}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              프로필
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <Home className="mr-2 h-4 w-4" />
              프로필
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 flex w-full h-16 items-center justify-between border-b px-6 bg-background">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">UNU</span>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-light text-muted-foreground">
            CNU 페이지
          </span>
        </div>
      </Link>

      {/* Right Content */}
      {renderRightContent()}
    </header>
  );
}
