"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, FileText, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function NotFound() {
  const { userRole } = useAuth();
  const authenticated = userRole === "MEMBER" || userRole === "ADMIN";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center space-y-6 py-12 text-center">
          {/* Icon */}
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>

          {/* 404 Title */}
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              404
            </h2>
            <h2 className="text-2xl font-semibold text-foreground">
              요청하신 페이지를 찾을 수 없습니다
            </h2>
          </div>

          {/* Description */}
          <p className="max-w-sm text-muted-foreground">
            페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
            <br />
            입력하신 주소가 정확한지 다시 한번 확인해 주세요.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                홈으로 돌아가기
              </Link>
            </Button>

            {authenticated ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href="/manage">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  대시보드로 이동
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href="/apply">
                  <FileText className="mr-2 h-4 w-4" />
                  모집 지원하기
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
