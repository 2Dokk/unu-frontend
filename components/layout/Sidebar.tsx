"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { getMenuByRole } from "@/lib/constants/menu-config";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { userRole } = useAuth();
  const menuItems = getMenuByRole(userRole);

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item, index) => {
            if (item.type === "separator") {
              return <Separator key={`separator-${index}`} className="my-2" />;
            }

            const isCurrentQuarterActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Button
                key={item.href}
                variant={isCurrentQuarterActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isCurrentQuarterActive && "bg-secondary font-semibold",
                )}
                asChild
                onClick={onNavigate}
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

      <div className="border-t p-4">
        <div className="text-sm">
          <p className="font-medium">권한</p>
          <p className="text-muted-foreground">{userRole}</p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-200 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex justify-end p-2 border-b">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[calc(100%-49px)]">
          <SidebarContent onNavigate={() => setIsOpen(false)} />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-40 hidden md:flex h-screen w-64 border-r bg-background shrink-0 flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
