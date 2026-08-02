"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Recruit", href: "/apply" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function PublicNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            pathname === href ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
