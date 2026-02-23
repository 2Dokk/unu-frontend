"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getActiveRecruitment,
  getRecruitmentById,
} from "@/lib/api/recruitment";
import { getFormById } from "@/lib/api/form";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import { FormResponse } from "@/lib/interfaces/form";
import {
  FormSchema,
  parseSchema,
  Question,
} from "@/lib/interfaces/form-builder";
import { createApplication } from "@/lib/api/application";
import { toast } from "sonner";

type RecruitmentStatus = "모집중" | "모집 예정" | "모집 마감";

export default function ApplicationFormPage() {
  const router = useRouter();

  const [recruitment, setRecruitment] = useState<RecruitmentResponse | null>(
    null,
  );
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic info state
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [major, setMajor] = useState("");
  const [subMajor, setSubMajor] = useState("");
  const [email, setEmail] = useState("");
  const [githubId, setGithubId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Answers state (dynamic)
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const recruitmentData = await getActiveRecruitment();

      setRecruitment(recruitmentData);
      console.log("Fetched recruitment data:", recruitmentData);

      const parsedSchema = parseSchema(recruitmentData.form.schema);
      setSchema(parsedSchema);
    } catch (error) {
      console.error("Failed to load form:", error);
      setError("지원서를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function getRecruitmentStatus(): RecruitmentStatus {
    if (!recruitment) return "모집 마감";

    const now = new Date();
    const start = new Date(recruitment.startAt);
    const end = new Date(recruitment.endAt);

    if (now < start) return "모집 예정";
    if (now > end) return "모집 마감";
    return "모집중";
  }

  function canSubmit(): boolean {
    if (!recruitment) return false;
    const status = getRecruitmentStatus();
    return status === "모집중" && recruitment.active;
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    // Validate basic info
    if (!name.trim()) newErrors.name = "이름을 입력해주세요.";
    if (!studentId.trim()) newErrors.studentId = "학번을 입력해주세요.";
    if (!major.trim()) newErrors.major = "전공을 입력해주세요.";
    if (!email.trim()) newErrors.email = "이메일을 입력해주세요.";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "연락처를 입력해주세요.";
    if (!password.trim()) newErrors.password = "비밀번호를 입력해주세요.";
    else if (password.length < 6)
      newErrors.password = "비밀번호는 6자 이상이어야 합니다.";
    if (!passwordConfirm.trim())
      newErrors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
    else if (password !== passwordConfirm)
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";

    // Validate required questions
    if (schema) {
      schema.questions.forEach((question) => {
        if (question.required) {
          const answer = answers[question.id];
          if (
            answer === undefined ||
            answer === null ||
            answer === "" ||
            (Array.isArray(answer) && answer.length === 0)
          ) {
            newErrors[`q_${question.id}`] = "필수 질문입니다.";
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit()) {
      toast.error("모집 기간에만 제출할 수 있습니다.");
      return;
    }

    if (!validateForm()) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createApplication({
        name,
        studentId,
        major,
        subMajor: subMajor || undefined,
        email,
        githubId: githubId || undefined,
        phoneNumber,
        answers,
        recruitmentId: recruitment!.id,
        formId: recruitment!.form.id,
        password: password,
      });

      // Navigate to success page
      router.push("/apply/complete");
    } catch (error) {
      console.error("Failed to submit application:", error);
      toast.error("지원서 제출에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  function handleAnswerChange(questionId: string, value: any) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    // Clear error for this question
    if (errors[`q_${questionId}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`q_${questionId}`];
        return newErrors;
      });
    }
  }

  function renderQuestion(question: Question, index: number) {
    const questionKey = `q_${question.id}`;
    const hasError = !!errors[questionKey];

    return (
      <div key={question.id} className="space-y-3">
        <Label htmlFor={question.id} className="text-base">
          <span className="font-semibold">Q{index + 1}.</span> {question.title}
          {question.required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>

        {question.type === "SHORT_TEXT" && (
          <Input
            id={question.id}
            value={answers[question.id] || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="답변을 입력하세요"
            disabled={!canSubmit()}
            className={hasError ? "border-destructive" : ""}
          />
        )}

        {question.type === "LONG_TEXT" && (
          <Textarea
            id={question.id}
            value={answers[question.id] || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="답변을 입력하세요"
            rows={4}
            disabled={!canSubmit()}
            className={hasError ? "border-destructive" : ""}
          />
        )}

        {question.type === "SINGLE_CHOICE" && question.options && (
          <RadioGroup
            value={answers[question.id] || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            disabled={!canSubmit()}
          >
            {question.options.map((option, optIdx) => (
              <div key={optIdx} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`${question.id}_${optIdx}`}
                />
                <Label
                  htmlFor={`${question.id}_${optIdx}`}
                  className="font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === "MULTIPLE_CHOICE" && question.options && (
          <div className="space-y-2">
            {question.options.map((option, optIdx) => {
              const selectedValues = answers[question.id] || [];
              const isChecked =
                Array.isArray(selectedValues) &&
                selectedValues.includes(option);

              return (
                <div key={optIdx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}_${optIdx}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(answers[question.id])
                        ? [...answers[question.id]]
                        : [];

                      if (checked) {
                        handleAnswerChange(question.id, [
                          ...currentValues,
                          option,
                        ]);
                      } else {
                        handleAnswerChange(
                          question.id,
                          currentValues.filter((v) => v !== option),
                        );
                      }
                    }}
                    disabled={!canSubmit()}
                  />
                  <Label
                    htmlFor={`${question.id}_${optIdx}`}
                    className="font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        )}

        {hasError && (
          <p className="text-sm text-destructive">{errors[questionKey]}</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !recruitment || !schema) {
    return (
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                {error || "지원서를 불러올 수 없습니다."}
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => loadData()} variant="outline">
                  다시 시도
                </Button>
                <Button onClick={() => router.push("/apply")}>돌아가기</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getRecruitmentStatus();
  const canSubmitForm = canSubmit();

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/apply")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold flex-1">{recruitment.title}</h1>
            <Badge
              className={
                status === "모집중"
                  ? "bg-green-500 text-white"
                  : status === "모집 예정"
                    ? ""
                    : "bg-gray-400"
              }
              variant={status === "모집중" ? "default" : "secondary"}
            >
              {status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            질문에 답변을 입력한 뒤 제출하세요.
          </p>
        </div>

        {!canSubmitForm && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                모집 기간에만 제출할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Basic Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="홍길동"
                  disabled={!canSubmitForm}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">
                  학번 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    if (errors.studentId) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.studentId;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="2021000000"
                  disabled={!canSubmitForm}
                  className={errors.studentId ? "border-destructive" : ""}
                />
                {errors.studentId && (
                  <p className="text-sm text-destructive">{errors.studentId}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="major">
                  전공 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="major"
                  value={major}
                  onChange={(e) => {
                    setMajor(e.target.value);
                    if (errors.major) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.major;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="컴퓨터공학과"
                  disabled={!canSubmitForm}
                  className={errors.major ? "border-destructive" : ""}
                />
                {errors.major && (
                  <p className="text-sm text-destructive">{errors.major}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subMajor">부전공</Label>
                <Input
                  id="subMajor"
                  value={subMajor}
                  onChange={(e) => setSubMajor(e.target.value)}
                  placeholder="선택사항"
                  disabled={!canSubmitForm}
                />
              </div>
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
                  if (errors.email) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.email;
                      return newErrors;
                    });
                  }
                }}
                placeholder="example@email.com"
                disabled={!canSubmitForm}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  연락처 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.phoneNumber;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="010-0000-0000"
                  disabled={!canSubmitForm}
                  className={errors.phoneNumber ? "border-destructive" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubId">GitHub ID</Label>
                <Input
                  id="githubId"
                  value={githubId}
                  onChange={(e) => setGithubId(e.target.value)}
                  placeholder="선택사항"
                  disabled={!canSubmitForm}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    if (errors.password) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.password;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="6자 이상"
                  disabled={!canSubmitForm}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  지원서 조회 시 사용됩니다
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">
                  비밀번호 확인 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    if (errors.passwordConfirm) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.passwordConfirm;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="비밀번호 재입력"
                  disabled={!canSubmitForm}
                  className={errors.passwordConfirm ? "border-destructive" : ""}
                />
                {errors.passwordConfirm && (
                  <p className="text-sm text-destructive">
                    {errors.passwordConfirm}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <CardTitle>지원서 질문</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {schema.questions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                질문이 없습니다.
              </p>
            ) : (
              schema.questions.map((question, index) =>
                renderQuestion(question, index),
              )
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/apply")}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmitForm || isSubmitting}
          >
            {isSubmitting ? "제출 중..." : "제출하기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
