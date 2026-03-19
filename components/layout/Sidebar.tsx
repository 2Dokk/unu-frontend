"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { getMenuByRole } from "@/lib/constants/menu-config";

const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  ADMIN:    { label: "관리자", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  MANAGER:  { label: "매니저", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  MEMBER:   { label: "멤버",   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  GUEST:    { label: "게스트", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { userRole } = useAuth();
  const menuItems = getMenuByRole(userRole);
  const roleMeta = ROLE_LABEL[userRole] ?? ROLE_LABEL["GUEST"];

  const sections: Array<Array<typeof menuItems[number]>> = [];
  let current: typeof menuItems = [];
  for (const item of menuItems) {
    if (item.type === "separator") {
      if (current.length) sections.push(current);
      current = [];
    } else {
      current.push(item);
    }
  }
  if (current.length) sections.push(current);

  const SECTION_LABELS = ["", "관리", "시스템"];

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-[#0f1117]">
      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="space-y-5">
          {sections.map((section, si) => (
            <div key={si}>
              {SECTION_LABELS[si] && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {SECTION_LABELS[si]}
                </p>
              )}
              <div className="space-y-0.5">
                {section.map((item) => {
                  if (item.type === "separator") return null;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" &&
                      item.href !== "/manage" &&
                      pathname.startsWith(item.href)) ||
                    (item.href === "/manage" && pathname === "/manage");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                          : "text-slate-500 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-200",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                          isActive
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", roleMeta.color)}>
            {roleMeta.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 border-r border-slate-200 dark:border-slate-700 transition-transform duration-200 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex justify-end p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0f1117]">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[calc(100%-49px)]">
          <SidebarContent onNavigate={() => setIsOpen(false)} />
        </div>
      </aside>

      <aside className="sticky top-0 z-40 hidden md:flex h-screen w-60 border-r border-slate-200 dark:border-slate-700 shrink-0 flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
