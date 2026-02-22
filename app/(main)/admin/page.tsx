"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
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
    title: "회원가입 링크 생성",
    description: "새 학회원을 초대하기 위한 1회성 회원가입 링크를 생성합니다.",
    icon: UserPlus,
    href: "/manage/members/signup-link",
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
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">시스템 관리</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          관리자 전용 기능입니다.
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
