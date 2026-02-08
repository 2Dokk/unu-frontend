"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Save, Trash2, Lock } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  verifyApplication,
  updatePublicApplication,
  cancelPublicApplication,
} from "@/lib/api/application";
import {
  ApplicationResponse,
  ApplicationRequest,
} from "@/lib/interfaces/application";
import {
  FormSchema,
  parseSchema,
  Question,
} from "@/lib/interfaces/form-builder";

const STATUS_BADGE_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  APPLIED: { label: "제출됨", variant: "default" },
  CANCELED: { label: "취소됨", variant: "secondary" },
  PASSED: { label: "합격", variant: "default" },
  REJECTED: { label: "불합격", variant: "destructive" },
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = Number(params.applicationId);

  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(true);
  const [application, setApplication] = useState<ApplicationResponse | null>(
    null,
  );
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable state
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    // Check if password exists in sessionStorage
    const storedPassword = sessionStorage.getItem(`app_${applicationId}_pwd`);
    if (storedPassword) {
      setPassword(storedPassword);
      setNeedsPassword(false);
      loadApplication(storedPassword);
    }
  }, [applicationId]);

  async function loadApplication(pwd: string) {
    try {
      setIsLoading(true);
      setError(null);

      const data = await verifyApplication(applicationId, pwd);
      setApplication(data);
      setNeedsPassword(false);
      setPassword(pwd);
      sessionStorage.setItem(`app_${applicationId}_pwd`, pwd);
      console.log("Loaded application data:", data);

      // Parse form schema and answers
      if (data.formSnapshot && data.answers) {
        try {
          const parsedSchema =
            typeof data.formSnapshot === "string"
              ? JSON.parse(data.formSnapshot)
              : data.formSnapshot;
          setSchema(parsedSchema);

          const parsedAnswers =
            typeof data.answers === "string"
              ? JSON.parse(data.answers)
              : data.answers;
          setAnswers(parsedAnswers);
        } catch (e) {
          console.error("Failed to parse schema or answers:", e);
        }
      }

      // Clear password from sessionStorage after successful load
      sessionStorage.removeItem(`app_${applicationId}_pwd`);
    } catch (error: any) {
      console.error("Failed to load application:", error);
      setError("비밀번호가 올바르지 않거나 지원서를 찾을 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    await loadApplication(password);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset answers to original
    if (application) {
      try {
        const parsedAnswers =
          typeof application.answers === "string"
            ? JSON.parse(application.answers)
            : application.answers;
        setAnswers(parsedAnswers);
      } catch (e) {
        console.error("Failed to reset answers:", e);
      }
    }
  };

  const handleSave = async () => {
    if (!password || !application) {
      setError("비밀번호가 필요합니다.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const applicationData = {
        recruitmentId: application.recruitmentId,
        formId: application.formId,
        name: application.name,
        studentId: application.studentId,
        major: application.major,
        subMajor: application.subMajor || undefined,
        email: application.email,
        githubId: application.githubId || undefined,
        phoneNumber: application.phoneNumber,
        password: password,
        answers: answers,
      };
      console.log("Updating application with data:", applicationData);

      const updatedApp = await updatePublicApplication(
        applicationId,
        applicationData,
      );
      setApplication(updatedApp);
      setIsEditing(false);

      // Show success message
      alert("지원서가 성공적으로 수정되었습니다.");
    } catch (error: any) {
      console.error("Failed to update application:", error);
      setError("지원서 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!password) {
      setError("비밀번호가 필요합니다.");
      return;
    }

    try {
      setIsCanceling(true);
      setError(null);

      await cancelPublicApplication(applicationId, password);

      // Show success and navigate back
      alert("지원이 취소되었습니다.");
      router.push("/apply/my");
    } catch (error: any) {
      console.error("Failed to cancel application:", error);
      setError("지원 취소에 실패했습니다. 다시 시도해주세요.");
      setIsCanceling(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const canEdit = application?.status === "APPLIED";

  // Password verification UI
  if (needsPassword) {
    return (
      <div className="container mx-auto max-w-md py-16 px-4">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">비밀번호 확인</CardTitle>
            <CardDescription className="text-center">
              지원서를 확인하려면 비밀번호를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
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
                  onClick={() => router.push("/apply/my")}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  돌아가기
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "확인 중..." : "확인"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <Skeleton className="h-10 w-3/4 mb-6" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error or no application
  if (error || !application) {
    return (
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                {error || "지원서를 불러올 수 없습니다."}
              </p>
              <Button onClick={() => router.push("/apply/my")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_BADGE_MAP[application.status] || {
    label: application.status,
    variant: "outline",
  };

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/apply/my")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">지원서 상세</h1>
            <p className="text-muted-foreground">지원서 ID: {application.id}</p>
          </div>
          <Badge variant={statusInfo.variant} className="text-sm">
            {statusInfo.label}
          </Badge>
        </div>

        {!canEdit && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              검토가 시작된 지원서는 수정할 수 없습니다.
            </p>
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">이름</p>
              <p className="font-medium">{application.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">학번</p>
              <p className="font-medium">{application.studentId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">전공</p>
              <p className="font-medium">{application.major}</p>
            </div>
            {application.subMajor && (
              <div>
                <p className="text-sm text-muted-foreground">부전공</p>
                <p className="font-medium">{application.subMajor}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">이메일</p>
              <p className="font-medium">{application.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">연락처</p>
              <p className="font-medium">{application.phoneNumber}</p>
            </div>
            {application.githubId && (
              <div>
                <p className="text-sm text-muted-foreground">GitHub ID</p>
                <p className="font-medium">{application.githubId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">제출일</p>
              <p className="font-medium">
                {new Date(application.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>지원서 답변</CardTitle>
            {canEdit && !isEditing && (
              <Button onClick={handleEdit} size="sm" variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                수정하기
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!schema || !answers || Object.entries(answers).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              답변이 없습니다.
            </p>
          ) : (
            schema.questions.map((question: Question, index: number) => {
              const answer = answers[question.id];
              if (answer === undefined) return null;

              return (
                <div key={question.id} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">
                      Q{index + 1}. {question.title}
                      {question.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      {question.type === "SHORT_TEXT" && (
                        <Input
                          value={answer || ""}
                          onChange={(e) =>
                            handleAnswerChange(question.id, e.target.value)
                          }
                          placeholder="답변을 입력하세요"
                          className="text-base"
                        />
                      )}
                      {question.type === "LONG_TEXT" && (
                        <Textarea
                          value={answer || ""}
                          onChange={(e) =>
                            handleAnswerChange(question.id, e.target.value)
                          }
                          rows={6}
                          placeholder="답변을 입력하세요"
                          className="text-base resize-none"
                        />
                      )}
                      {question.type === "SINGLE_CHOICE" && (
                        <RadioGroup
                          value={answer || ""}
                          onValueChange={(value) =>
                            handleAnswerChange(question.id, value)
                          }
                        >
                          {question.options?.map((option) => (
                            <div
                              key={option}
                              className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
                            >
                              <RadioGroupItem
                                value={option}
                                id={`${question.id}-${option}`}
                              />
                              <Label
                                htmlFor={`${question.id}-${option}`}
                                className="flex-1 cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      {question.type === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          {question.options?.map((option) => {
                            const selectedOptions = Array.isArray(answer)
                              ? answer
                              : [];
                            return (
                              <div
                                key={option}
                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
                              >
                                <Checkbox
                                  id={`${question.id}-${option}`}
                                  checked={selectedOptions.includes(option)}
                                  onCheckedChange={(checked) => {
                                    const newSelection = checked
                                      ? [...selectedOptions, option]
                                      : selectedOptions.filter(
                                          (o) => o !== option,
                                        );
                                    handleAnswerChange(
                                      question.id,
                                      newSelection,
                                    );
                                  }}
                                />
                                <Label
                                  htmlFor={`${question.id}-${option}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  {option}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                      {question.type === "MULTIPLE_CHOICE" &&
                      Array.isArray(answer) ? (
                        <ul className="space-y-1.5">
                          {answer.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {typeof answer === "string"
                            ? answer
                            : JSON.stringify(answer, null, 2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {canEdit && (
        <div className="flex justify-end gap-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isCanceling}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isCanceling ? "취소 중..." : "지원 취소"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>지원을 취소하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 지원을 취소하면 다시
                    지원하셔야 합니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>돌아가기</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    확인
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
