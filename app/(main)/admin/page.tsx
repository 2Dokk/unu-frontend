"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Tag, CalendarDays, Users, KeyRound, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminMenuItem {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const adminMenuItems: AdminMenuItem[] = [
  {
    title: "활동 유형 관리",
    description: "활동 유형을 생성, 수정, 삭제하고 조회합니다.",
    icon: Tag,
    href: "/admin/activity-types",
  },
  {
    title: "분기 관리",
    description: "분기를 생성, 수정, 삭제하고 현재 분기를 지정합니다.",
    icon: CalendarDays,
    href: "/admin/quarters",
  },
  {
    title: "회원가입 링크 생성",
    description: "새 학회원을 초대하기 위한 1회성 회원가입 링크를 생성합니다.",
    icon: UserPlus,
    href: "/admin/signup-link",
  },
  {
    title: "회원 대량 생성",
    description: "CSV 파일을 업로드하여 회원을 일괄 생성합니다.",
    icon: Users,
    href: "/admin/migrations",
  },
  {
    title: "비밀번호 초기화",
    description: "학회원의 비밀번호를 초기화하고 임시 비밀번호를 발급합니다.",
    icon: KeyRound,
    href: "/admin/reset-password",
  },
  {
    title: "활동 학회원 계산",
    description: "현재 분기 활동 학회원 여부를 계산하여 업데이트합니다.",
    icon: RefreshCw,
    href: "/admin/calculate-active",
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("ADMIN"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("ADMIN")) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">시스템 관리</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          관리자 전용 기능입니다
        </p>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.href}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(item.href)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(item.href);
                  }}
                >
                  이동
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
