"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Home, LogOut, Menu, User } from "lucide-react";
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
import { PublicNavLinks } from "@/components/custom/public-nav-links";
import { TimedAnchorLink } from "@/components/custom/timed-anchor-link";

export function NavigationBar() {
  const router = useRouter();
  const { userRole, logout, isLoading } = useAuth();
  const { setIsOpen } = useSidebar();
  const [currentQuarter, setCurrentQuarter] =
    React.useState<QuarterResponse | null>(null);

  React.useEffect(() => {
    getCurrentQuarter().then(setCurrentQuarter).catch(() => undefined);
  }, []);

  const rightContent = () => {
    if (isLoading) return <div className="h-16 w-20 sm:w-[148px]" />;

    if (userRole === "GUEST") {
      return (
        <Link
          href="/login"
          className="font-cnu-body flex h-16 items-center justify-center px-4 text-base text-[#999999] transition-colors hover:bg-[rgba(225,238,224,0.33)] hover:text-black sm:w-[148px] sm:px-0 sm:text-[19.8px]"
        >
          로그인
        </Link>
      );
    }

    return (
      <div className="flex h-16 items-center gap-2 pr-3 md:gap-4 md:pr-6">
        {currentQuarter && (
          <span className="font-cnu-body hidden text-sm font-medium text-[#777777] sm:block">
            {currentQuarter.year} {currentQuarter.season.toUpperCase()}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="font-cnu-body gap-2 rounded-none text-[#777777] hover:bg-[rgba(225,238,224,0.33)] hover:text-black"
            >
              <User className="size-4" />
              <span className="hidden sm:inline">프로필</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push("/home")}>
              <Home className="mr-2 size-4" />홈
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 size-4" />프로필
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 size-4" />로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center border-b border-black/5 bg-white/95 pl-4 backdrop-blur md:pl-[29px]">
      {!isLoading && userRole !== "GUEST" && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={() => setIsOpen(true)}
          aria-label="메뉴 열기"
        >
          <Menu className="size-5" />
        </Button>
      )}

      <TimedAnchorLink
        href="/"
        targetId="home-top"
        duration={900}
        className="relative size-[35px] shrink-0 overflow-hidden rounded-[9px] transition-opacity hover:opacity-80"
      >
        <Image
          src="/cnu-header-logo.png"
          alt="CNU"
          fill
          sizes="35px"
          className="object-cover"
          priority
        />
        <span className="sr-only">CNU 홈</span>
      </TimedAnchorLink>

      <div className="ml-auto flex h-16 items-stretch">
        <PublicNavLinks />
        {rightContent()}
      </div>
    </header>
  );
}
