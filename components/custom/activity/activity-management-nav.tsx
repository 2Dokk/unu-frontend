"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/manage/activities", label: "활동 목록" },
  { href: "/manage/activities/applications", label: "참여 신청 관리" },
];

export function ActivityManagementNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-b" aria-label="활동 관리 메뉴">
      {ITEMS.map((item, index) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-1 pb-3 pt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              index < ITEMS.length - 1 && "mr-7",
              active && "text-foreground",
            )}
          >
            {item.label}
            {active && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#174b3a]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
