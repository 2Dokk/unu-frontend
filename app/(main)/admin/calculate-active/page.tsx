"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/contexts/AuthContext";
import { calculateActiveMembers } from "@/lib/api/user";

export default function CalculateActivePage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("ADMIN"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("ADMIN")) return null;

  async function handleCalculate() {
    setIsCalculating(true);
    setError(null);
    setDone(false);
    try {
      await calculateActiveMembers();
      setDone(true);
    } catch (e: any) {
      setError("계산 중 오류가 발생했습니다.");
    } finally {
      setIsCalculating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">활동 학회원 계산</h1>
        <p className="text-sm text-muted-foreground">
          현재 분기 활동 학회원 여부를 계산하여 업데이트합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">현재 분기 활동 학회원 계산</CardTitle>
          <CardDescription>
            현재 분기에 활동한 학회원을 자동으로 계산하고 활동 상태를 업데이트합니다.
            계산이 완료되면 각 학회원의 활동 여부가 갱신됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              활동 학회원 계산이 완료되었습니다.
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button onClick={handleCalculate} disabled={isCalculating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isCalculating ? "animate-spin" : ""}`} />
            {isCalculating ? "계산 중..." : "계산 실행"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
