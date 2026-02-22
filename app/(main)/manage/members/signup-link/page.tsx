"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import { generateSignupToken } from "@/lib/api/auth";
import { SignupTokenResponseDto } from "@/lib/interfaces/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignupLinkPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();

  const [tokenData, setTokenData] = useState<SignupTokenResponseDto | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("ADMIN"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("ADMIN")) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateSignupToken();
      setTokenData(data);
    } catch {
      setError("토큰 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const signupUrl = tokenData
    ? `${window.location.origin}/signup?token=${tokenData.token}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(signupUrl);
    toast.success("링크가 클립보드에 복사되었습니다.");
  };

  const formatExpiry = (expiresAt: string) => {
    return new Date(expiresAt).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          회원가입 링크 생성
        </h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          초대할 학회원에게 전달할 회원가입 링크를 생성합니다. 링크는 만료
          시간까지만 유효합니다.
        </p>
      </div>

      {/* Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">초대 링크</CardTitle>
          <CardDescription>
            생성된 링크를 초대할 학회원에게 전달하세요. 링크를 통해 회원가입
            페이지에 접근할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenData ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={signupUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="링크 복사"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                만료 시간: {formatExpiry(tokenData.expiresAt)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              아래 버튼을 눌러 회원가입 링크를 생성하세요.
            </p>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={loading} className="gap-2">
            {loading ? (
              "생성 중..."
            ) : tokenData ? (
              <>
                <RefreshCw className="h-4 w-4" />새 링크 생성
              </>
            ) : (
              <>
                <Link className="h-4 w-4" />
                링크 생성
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
