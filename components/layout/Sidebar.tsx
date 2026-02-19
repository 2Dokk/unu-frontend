"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getMenuByRole } from "@/lib/constants/menu-config";

export function Sidebar() {
  const pathname = usePathname();
  const { userRole } = useAuth();
  const menuItems = getMenuByRole(userRole);

  console.log(menuItems);

  return (
    <aside className="sticky top-0 z-40 h-screen w-64 border-r bg-background shrink-0">
      <div className="flex h-full flex-col">
        {/* Navigation Menu */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.type === "separator") {
                return (
                  <Separator key={`separator-${index}`} className="my-2" />
                );
              }

              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-secondary font-semibold",
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Info Section (Optional) */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">권한</p>
              <p className="text-muted-foreground">{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Sidebar가 표시될 때 메인 콘텐츠를 밀어내기 위한 Wrapper
 */
export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={cn(
          "flex-1",
          userRole !== "GUEST" && "ml-64", // Sidebar width만큼 왼쪽 마진
        )}
      >
        {children}
      </main>
    </div>
  );
}
