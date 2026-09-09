"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signup, verifySignupEligibility } from "@/lib/api/auth";
import { SignUpRequestDto, SignupEligibility } from "@/lib/interfaces/auth";

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [studentId, setStudentId] = useState("");
  const [eligibility, setEligibility] = useState<SignupEligibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setEligibility(await verifySignupEligibility(token!, studentId));
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "가입 대상을 확인하지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eligibility) return;
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data: SignUpRequestDto = {
        name: formData.get("name") as string,
        username: formData.get("username") as string,
        password,
        studentId: eligibility.studentId,
        major: formData.get("major") as string,
        subMajor: formData.get("subMajor") as string,
        email: formData.get("email") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        githubId: formData.get("githubId") as string,
      };
      await signup(data, token!);
      router.push("/login");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "회원가입 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>
            {eligibility
              ? "사용할 계정 정보를 입력해주세요."
              : "확인을 위해 학번을 먼저 입력해주세요."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!eligibility ? (
            <form onSubmit={handleVerify}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="studentId">학번</FieldLabel>
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(event) =>
                      setStudentId(event.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    placeholder="학번 8자리를 입력하세요"
                    className="h-11"
                    inputMode="numeric"
                    maxLength={8}
                    pattern="[0-9]{8}"
                    autoFocus
                    required
                  />
                </Field>
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Field>
                  <Button type="submit" className="h-11 w-full" disabled={loading}>
                    {loading ? "확인 중..." : "가입 대상 확인"}
                  </Button>
                </Field>
                <FieldDescription className="text-center text-xs text-muted-foreground">
                  명단에 등록된 학번만 가입할 수 있습니다.
                </FieldDescription>
              </FieldGroup>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="rounded-md border bg-muted/40 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">가입 대상 확인 완료</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {eligibility.studentId} · {eligibility.joinedQuarterName}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {eligibility.invitationName}
                      </p>
                    </div>
                  </div>
                </div>
                <Field>
                  <FieldLabel htmlFor="name">이름</FieldLabel>
                  <Input id="name" name="name" type="text" defaultValue={eligibility.name ?? ""} placeholder="이름을 입력하세요" className="h-11" maxLength={50} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="major">전공</FieldLabel>
                  <Input id="major" name="major" type="text" defaultValue={eligibility.major ?? ""} placeholder="전공을 입력하세요" className="h-11" maxLength={100} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="subMajor">부전공</FieldLabel>
                  <Input id="subMajor" name="subMajor" type="text" defaultValue={eligibility.subMajor ?? ""} placeholder="부전공이 있다면 입력하세요 (선택)" className="h-11" maxLength={100} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="username">아이디</FieldLabel>
                  <Input id="username" name="username" type="text" placeholder="아이디를 입력하세요" className="h-11" maxLength={50} pattern="[A-Za-z0-9._-]+" title="영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있습니다." autoComplete="username" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                  <Input id="password" name="password" type="password" placeholder="다른 서비스에서 자주 사용하지 않는 비밀번호를 사용해 주세요" className="h-11" minLength={8} maxLength={100} autoComplete="new-password" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
                  <Input id="passwordConfirm" name="passwordConfirm" type="password" placeholder="비밀번호를 다시 입력해 주세요" className="h-11" minLength={8} maxLength={100} autoComplete="new-password" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">이메일</FieldLabel>
                  <Input id="email" name="email" type="email" defaultValue={eligibility.email ?? ""} placeholder="이메일을 입력하세요" className="h-11" maxLength={255} autoComplete="email" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phoneNumber">전화번호</FieldLabel>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    defaultValue={eligibility.phoneNumber ?? ""}
                    placeholder="010-0000-0000"
                    className="h-11"
                    inputMode="numeric"
                    maxLength={13}
                    pattern="010-[0-9]{4}-[0-9]{4}"
                    title="전화번호는 010-0000-0000 형식으로 입력해주세요."
                    autoComplete="tel"
                    onInput={(event) => {
                      event.currentTarget.value = formatPhoneNumber(event.currentTarget.value);
                    }}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="githubId">GitHub ID</FieldLabel>
                  <Input id="githubId" name="githubId" type="text" defaultValue={eligibility.githubId ?? ""} placeholder="GitHub 아이디를 입력하세요 (선택)" className="h-11" maxLength={100} autoComplete="off" />
                </Field>
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => {
                      setEligibility(null);
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    뒤로가기
                  </Button>
                  <Button type="submit" className="h-11 flex-1" disabled={loading}>
                    {loading ? "처리 중..." : "회원가입"}
                  </Button>
                </div>
                <FieldDescription className="text-center text-xs text-muted-foreground">
                  계정 관련 문의는 운영진에게 연락해주세요.
                </FieldDescription>
              </FieldGroup>
            </form>
          )}
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
