"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TimedAnchorLink } from "@/components/custom/timed-anchor-link";
import { getBlogPosts } from "@/lib/api/blog";
import { getPortfolios } from "@/lib/api/portfolio";

const NAV_ITEMS = [
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

export function PublicNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden h-16 items-stretch lg:flex" aria-label="공개 메뉴">
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
  );
}
