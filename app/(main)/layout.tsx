"use client";

import { NavigationBar } from "@/components/custom/navigation-bar";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1">
      {/* Top NavBar - 전체 폭 */}

      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
