"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signup } from "@/lib/api/auth";
import { getAllQuarters } from "@/lib/api/quarter";
import { SignUpRequestDto } from "@/lib/interfaces/auth";
import { QuarterResponse } from "@/lib/interfaces/quarter";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [joinedQuarterId, setJoinedQuarterId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    getAllQuarters()
      .then(setQuarters)
      .catch(() => {});
  }, [token]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">접근 불가</CardTitle>
            <CardDescription>
              유효하지 않은 초대 링크입니다.
              <br />
              관리자에게 초대 링크를 요청해주세요.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!joinedQuarterId) {
      setError("가입 기수를 선택해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: SignUpRequestDto = {
        name: formData.get("name") as string,
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        studentId: formData.get("studentId") as string,
        email: formData.get("email") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        githubId: formData.get("githubId") as string,
        joinedQuarterId,
      };

      await signup(data, token);
      router.push("/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>
            학회원으로 초대되셨습니다. 아래 정보를 입력해 계정을 만들어주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">이름</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  className="h-11"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="username">아이디</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  className="h-11"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  className="h-11"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="studentId">학번</FieldLabel>
                <Input
                  id="studentId"
                  name="studentId"
                  type="text"
                  placeholder="학번을 입력하세요"
                  className="h-11"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  className="h-11"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phoneNumber">전화번호</FieldLabel>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="010-0000-0000"
                  className="h-11"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="githubId">GitHub ID</FieldLabel>
                <Input
                  id="githubId"
                  name="githubId"
                  type="text"
                  placeholder="GitHub 아이디를 입력하세요"
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel>가입 기수</FieldLabel>
                <Select
                  value={joinedQuarterId}
                  onValueChange={setJoinedQuarterId}
                  required
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="가입 기수를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {quarters.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Field>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading}
                >
                  {loading ? "처리 중..." : "회원가입"}
                </Button>
              </Field>
              <FieldDescription className="text-center text-xs text-muted-foreground">
                계정 관련 문의는 운영진에게 연락해주세요.
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
