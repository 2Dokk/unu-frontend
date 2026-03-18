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
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User, Home, Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";

export function NavigationBar() {
  const router = useRouter();
  const { userRole, logout: handleLogout, isLoading } = useAuth();
  const { setIsOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [currentQuarter, setCurrentQuarter] =
    React.useState<QuarterResponse | null>(null);

  React.useEffect(() => {
    getCurrentQuarter()
      .then(setCurrentQuarter)
      .catch((error) => {
        console.error("Failed to fetch current quarter:", error);
      });
  }, []);

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
            <DropdownMenuItem onClick={() => router.push("/home")}>
              <Home className="mr-2 h-4 w-4" />홈
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
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
    <header className="sticky top-0 z-50 flex w-full h-14 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {/* Mobile hamburger — only for logged-in users */}
        {userRole !== "GUEST" && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-xl font-bold tracking-tight">CNU&U</span>
        </Link>
      </div>

      {/* Right Content */}
      <div className="flex items-center gap-1">
        {/* 다크/라이트 토글 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="테마 전환"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {renderRightContent()}
      </div>
    </header>
  );
}
