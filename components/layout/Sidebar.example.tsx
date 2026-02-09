/**
 * Sidebar 사용 예시
 *
 * 이 파일은 Sidebar를 layout에 적용하는 예시입니다.
 * 실제 사용 시에는 app/(main)/layout.tsx를 수정하세요.
 */

"use client";

import { SidebarLayout } from "@/components/layout/Sidebar";

/**
 * 예시 1: SidebarLayout 래퍼 사용 (가장 간단)
 */
export function ExampleLayout1({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}

/**
 * 예시 2: NavigationBar와 함께 사용
 */
import { NavigationBar } from "@/components/custom/navigation-bar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

export function ExampleLayout2({ children }: { children: React.ReactNode }) {
  const userRole = useUserRole();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={cn("flex-1 flex flex-col", userRole !== "GUEST" && "ml-64")}
      >
        <NavigationBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

/**
 * 예시 3: 커스텀 레이아웃 (Sidebar + Header + Footer)
 */
export function ExampleLayout3({ children }: { children: React.ReactNode }) {
  const userRole = useUserRole();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={cn("flex-1 flex flex-col", userRole !== "GUEST" && "ml-64")}
      >
        {/* Header */}
        <header className="border-b h-16 flex items-center px-6">
          <h1 className="text-xl font-semibold">My Application</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>

        {/* Footer */}
        <footer className="border-t h-12 flex items-center justify-center text-sm text-muted-foreground">
          © 2026 ItNU - IT and You
        </footer>
      </div>
    </div>
  );
}

/**
 * 페이지에서 role 기반 조건부 렌더링 예시
 */
import { useHasRole } from "@/hooks/useUserRole";

export function ExamplePage() {
  const userRole = useUserRole();
  const isAdmin = useHasRole("ADMIN");
  const canManage = useHasRole("MANAGER");

  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      {/* 현재 role 표시 */}
      <div className="bg-muted p-4 rounded-lg">
        <p>
          Current Role: <strong>{userRole}</strong>
        </p>
      </div>

      {/* MEMBER 이상만 볼 수 있는 섹션 */}
      {userRole !== "GUEST" && (
        <section>
          <h2>내 활동</h2>
          <p>활동 목록...</p>
        </section>
      )}

      {/* MANAGER 이상만 볼 수 있는 섹션 */}
      {canManage && (
        <section>
          <h2>관리 대시보드</h2>
          <p>관리 기능...</p>
        </section>
      )}

      {/* ADMIN만 볼 수 있는 섹션 */}
      {isAdmin && (
        <section>
          <h2>시스템 설정</h2>
          <p>시스템 관리...</p>
        </section>
      )}
    </div>
  );
}
