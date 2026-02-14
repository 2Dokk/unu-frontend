"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
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
import { login } from "@/lib/api/auth";
import { LoginRequest } from "@/lib/interfaces/auth";
import { useState } from "react";

const LoginPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    setLoading(true);
    setError(null);

    try {
      const data: LoginRequest = {
        username: username as string,
        password: password as string,
      };
      const response = await login(data);

      Cookies.set("token", response.token);
      Cookies.set("refreshToken", response.refreshToken);

      console.log("Login successful:", response);

      // Redirect to dashboard after successful login
      router.push("/activities");
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">U-NU</CardTitle>
          <CardDescription>
            학회 운영 및 활동 관리를 위한 내부 시스템입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
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
                  {loading ? "로그인 중..." : "로그인"}
                </Button>
              </Field>
              <FieldDescription className="text-center text-xs text-muted-foreground">
                학회원 및 운영진만 로그인이 가능합니다.
                <br />
                계정 관련 문의는 운영진에게 연락해주세요.
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
