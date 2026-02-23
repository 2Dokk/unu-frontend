"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getApplicationById, reviewApplication } from "@/lib/api/application";
import { ApplicationResponse } from "@/lib/interfaces/application";
import { formatDateTime } from "@/lib/utils/date-utils";
import ApplicationStatusDropdown from "@/components/custom/application/application-status-dropdown";
import { toast } from "sonner";

interface FormQuestion {
  id: string;
  type: string;
  title?: string;
  label?: string;
  required?: boolean;
}

interface FormSnapshot {
  version?: number;
  questions?: FormQuestion[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PASSED":
      return <Badge className="bg-green-600 hover:bg-green-700">합격</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">불합격</Badge>;
    case "APPLIED":
      return <Badge variant="secondary">신청</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="secondary">검토중</Badge>;
    case "WAITING":
      return <Badge variant="secondary">대기</Badge>;
    case "HOLD":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
          보류
        </Badge>
      );
    case "CANCELED":
      return <Badge variant="outline">취소</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<ApplicationResponse | null>(
    null,
  );
  const [formSnapshot, setFormSnapshot] = useState<FormSnapshot | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    loadApplicationData();
  }, [applicationId]);

  async function loadApplicationData() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getApplicationById(applicationId);
      setApplication(data);
      console.log("Loaded application data:", data);

      // Parse formSnapshot
      try {
        const parsedSnapshot =
          typeof data.formSnapshot === "string"
            ? JSON.parse(data.formSnapshot)
            : data.formSnapshot;
        console.log("Parsed formSnapshot:", parsedSnapshot);
        setFormSnapshot(parsedSnapshot);
      } catch (e) {
        console.error("Failed to parse formSnapshot:", e);
        setFormSnapshot(null);
      }

      // Parse answers
      try {
        const parsedAnswers =
          typeof data.answers === "string"
            ? JSON.parse(data.answers)
            : data.answers;
        console.log("Parsed answers:", parsedAnswers);
        setAnswers(parsedAnswers);
      } catch (e) {
        console.error("Failed to parse answers:", e);
        setAnswers({});
      }
    } catch (error) {
      console.error("Failed to load application:", error);
      setError("지원서를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    if (!application) return;

    setIsUpdating(true);
    try {
      const updated = await reviewApplication(id, newStatus);
      setApplication(updated);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("상태 업데이트에 실패했습니다.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCopyEmail() {
    if (!application?.email) return;

    try {
      await navigator.clipboard.writeText(application.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (error) {
      console.error("Failed to copy email:", error);
    }
  }

  function handleBackToRecruitment() {
    if (application?.recruitmentId) {
      router.push(`/manage/recruitments/${application.recruitmentId}`);
    } else {
      router.push("/manage/recruitments");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
          <p className="text-muted-foreground">
            {error || "지원서를 찾을 수 없습니다."}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => loadApplicationData()} variant="outline">
              다시 시도
            </Button>
            <Button onClick={handleBackToRecruitment}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="border-b pb-6">
        <Button
          onClick={handleBackToRecruitment}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {application.name}의 지원서
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {getStatusBadge(application.status)}
              <span>•</span>
              <span>{formatDateTime(application.createdAt)} 제출</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ApplicationStatusDropdown
              applicationId={applicationId}
              currentStatus={application.status}
              onStatusChange={handleStatusChange}
              isUpdating={isUpdating}
            />
          </div>
        </div>
      </div>

      {/* Applicant Info */}
      <Card>
        <CardHeader>
          <CardTitle>지원자 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
            <div className="text-sm font-medium text-muted-foreground">
              이름
            </div>
            <div className="text-sm font-medium">{application.name}</div>

            <div className="text-sm font-medium text-muted-foreground">
              학번
            </div>
            <div className="text-sm">{application.studentId}</div>

            <div className="text-sm font-medium text-muted-foreground">
              전공
            </div>
            <div className="text-sm">
              {application.major}
              {application.subMajor && ` / ${application.subMajor}`}
            </div>

            <div className="text-sm font-medium text-muted-foreground">
              이메일
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{application.email}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={handleCopyEmail}
              >
                {copiedEmail ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            <div className="text-sm font-medium text-muted-foreground">
              전화번호
            </div>
            <div className="text-sm">{application.phoneNumber}</div>

            {application.githubId && (
              <>
                <div className="text-sm font-medium text-muted-foreground">
                  GitHub ID
                </div>
                <div className="text-sm">{application.githubId}</div>
              </>
            )}

            <div className="text-sm font-medium text-muted-foreground">
              제출일시
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDateTime(application.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Answers */}
      <Card>
        <CardHeader>
          <CardTitle>지원서 답변</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {formSnapshot?.questions && formSnapshot.questions.length > 0 ? (
            formSnapshot.questions.map((question, index) => {
              const answer = answers[question.id];
              const questionTitle = question.title || question.label || "";

              console.log(
                `Question ${question.id}:`,
                questionTitle,
                "Answer:",
                answer,
              );

              return (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-sm">
                        {question.required && <span className="mr-1">*</span>}
                        {questionTitle}
                      </p>
                    </div>
                  </div>
                  <div className="pl-8">
                    <div className="text-sm p-3 rounded-md bg-muted/50 whitespace-pre-wrap wrap-break-word">
                      {answer !== undefined && answer !== null && answer !== ""
                        ? String(answer)
                        : "-"}
                    </div>
                  </div>
                  {index < (formSnapshot.questions?.length ?? 0) - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">질문 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meta Info */}
      <Card>
        <CardHeader>
          <CardTitle>메타 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
            <div className="text-sm font-medium text-muted-foreground">
              지원서 ID
            </div>
            <div className="text-sm text-muted-foreground">
              {application.id}
            </div>

            <div className="text-sm font-medium text-muted-foreground">
              모집 공고 ID
            </div>
            <div className="text-sm text-muted-foreground">
              {application.recruitmentId}
            </div>

            <div className="text-sm font-medium text-muted-foreground">
              폼 ID
            </div>
            <div className="text-sm text-muted-foreground">
              {application.formId}
            </div>

            <div className="text-sm font-medium text-muted-foreground">
              제출일시
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDateTime(application.createdAt)}
            </div>

            <div className="text-sm font-medium text-muted-foreground">
              최종 수정일시
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDateTime(application.modifiedAt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
