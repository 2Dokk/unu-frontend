"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimedAnchorLink } from "@/components/custom/timed-anchor-link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBlogPosts } from "@/lib/api/blog";
import { getPortfolios } from "@/lib/api/portfolio";

const NAV_ITEMS = [
  {
    label: "소개",
    href: "/about",
    width: "w-[126px]",
  },
  {
    label: "활동",
    href: "/portfolio",
    width: "w-[126px]",
    preload: getPortfolios,
  },
  {
    label: "블로그",
    href: "/blog",
    width: "w-[133px]",
    preload: getBlogPosts,
  },
  {
    label: "문의",
    href: "/#contact",
    width: "w-[126px]",
    targetId: "contact",
  },
];

interface PublicNavLinksProps {
  showMobile?: boolean;
}

export function PublicNavLinks({ showMobile = true }: PublicNavLinksProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="hidden h-16 items-stretch md:flex" aria-label="공개 메뉴">
        {NAV_ITEMS.map(({ label, href, width, targetId, preload }) => {
          const route = href.split("#")[0] || "/";
          const isActive = route !== "/" && pathname.startsWith(route);
          const className = cn(
            "font-cnu-body flex h-16 items-center justify-center text-[17.8px] font-normal tracking-[0.18px] transition-colors",
            "hover:bg-white/10 hover:text-white",
            width,
            isActive
              ? "bg-white/10 text-white"
              : "text-white/80",
          );

          if (targetId) {
            return (
              <TimedAnchorLink
                key={href}
                href={href}
                targetId={targetId}
                duration={900}
                className={className}
              >
                {label}
              </TimedAnchorLink>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={className}
              onMouseEnter={() => void preload?.().catch(() => undefined)}
              onFocus={() => void preload?.().catch(() => undefined)}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {showMobile && (
        <div className="flex h-16 items-center md:hidden">
          <DropdownMenu
            modal={false}
            open={mobileMenuOpen}
            onOpenChange={setMobileMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-16 w-14 rounded-none text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="사이트 메뉴 열기"
              >
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {NAV_ITEMS.map(({ label, href, targetId, preload }) => {
                const route = href.split("#")[0] || "/";
                const isActive = route !== "/" && pathname.startsWith(route);
                const itemClassName = cn(
                  "font-cnu-body cursor-pointer",
                  isActive && "bg-accent font-medium",
                );

                if (targetId) {
                  return (
                    <DropdownMenuItem key={href} asChild className={itemClassName}>
                      <TimedAnchorLink
                        href={href}
                        targetId={targetId}
                        duration={900}
                        className="w-full"
                        onNavigate={() => setMobileMenuOpen(false)}
                      >
                        {label}
                      </TimedAnchorLink>
                    </DropdownMenuItem>
                  );
                }

                return (
                  <DropdownMenuItem key={href} asChild className={itemClassName}>
                    <Link
                      href={href}
                      onMouseEnter={() => void preload?.().catch(() => undefined)}
                      onFocus={() => void preload?.().catch(() => undefined)}
                    >
                      {label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
}
