"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupApplication, verifyApplication } from "@/lib/api/application";
import { ApplicationResponse } from "@/lib/interfaces/application";

export default function ApplicationLookupPage() {
  const router = useRouter();

  // Step 1: Search fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Step 2: Verify field
  const [password, setPassword] = useState("");

  const [foundApplication, setFoundApplication] =
    useState<ApplicationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("모든 정보를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Search for application
      const application = await lookupApplication({
        name: name.trim(),
        email: email.trim(),
      });

      setFoundApplication(application);
      setError(null);
    } catch (error: any) {
      console.error("Failed to search application:", error);
      setError("입력하신 정보와 일치하는 지원서를 찾을 수 없습니다.");
      setFoundApplication(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!foundApplication) {
      setError("먼저 지원서를 검색해주세요.");
      return;
    }

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);

      // Step 2: Verify password
      const verifiedApp = await verifyApplication(
        foundApplication.id,
        password,
      );

      // Store application data and password in sessionStorage for the detail page
      sessionStorage.setItem(
        "current_application",
        JSON.stringify(verifiedApp),
      );
      sessionStorage.setItem("current_application_pwd", password);

      // Navigate to detail page (no ID in URL)
      router.push("/apply/my/detail");
    } catch (error: any) {
      console.error("Failed to verify application:", error);
      setError("비밀번호가 올바르지 않습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-16 px-4">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">내 지원서 조회</h1>
        <p className="text-muted-foreground">
          본인 정보를 입력하여 제출한 지원서를 확인할 수 있습니다.
        </p>
      </div>

      {!foundApplication ? (
        // Step 1: Search form
        <Card>
          <CardHeader>
            <CardTitle>지원서 검색</CardTitle>
            <CardDescription>
              지원서 제출 시 입력한 본인 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="홍길동"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="example@email.com"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? "검색 중..." : "지원서 검색"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        // Step 2: Verify form
        <div className="space-y-4">
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">지원서를 찾았습니다</p>
                  <p className="text-sm text-muted-foreground">
                    제출일:{" "}
                    {new Date(foundApplication.createdAt).toLocaleDateString(
                      "ko-KR",
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">이름:</span>{" "}
                  <span className="font-medium">{foundApplication.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">이메일:</span>{" "}
                  <span className="font-medium">{foundApplication.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>비밀번호 확인</CardTitle>
              <CardDescription>
                지원서를 확인하려면 비밀번호를 입력해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    비밀번호 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="지원서 제출 시 설정한 비밀번호"
                    disabled={isLoading}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    비밀번호는 지원서 제출 시 설정한 비밀번호입니다.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFoundApplication(null);
                      setPassword("");
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    다시 검색
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "확인 중..." : "확인"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">안내사항</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• 지원서 제출 시 입력한 정보와 동일하게 입력해주세요.</li>
          <li>• 비밀번호를 잊으신 경우 관리자에게 문의해주세요.</li>
          <li>• 검토가 시작된 지원서는 수정할 수 없습니다.</li>
        </ul>
      </div>
    </div>
  );
}
