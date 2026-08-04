"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TimedAnchorLink } from "@/components/custom/timed-anchor-link";

const NAV_ITEMS = [
  { label: "활동", href: "/portfolio", width: "w-[126px]" },
  { label: "블로그", href: "/blog", width: "w-[133px]" },
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
      {NAV_ITEMS.map(({ label, href, width, targetId }) => {
        const route = href.split("#")[0] || "/";
        const isActive = route !== "/" && pathname.startsWith(route);
        const className = cn(
          "font-cnu-body flex h-16 items-center justify-center text-[17.8px] font-normal tracking-[0.18px] transition-colors",
          "hover:bg-[rgba(225,238,224,0.33)] hover:text-black",
          width,
          isActive
            ? "bg-[rgba(225,238,224,0.33)] text-black"
            : "text-[#999999]",
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
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
