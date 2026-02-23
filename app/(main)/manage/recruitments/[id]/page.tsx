"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecruitmentById, deleteRecruitment } from "@/lib/api/recruitment";
import { getApplicationsByRecruitmentId } from "@/lib/api/application";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import { ApplicationResponse } from "@/lib/interfaces/application";
import ApplicationsTable from "@/components/custom/application/application-table";
import { formatDate, formatDateTime } from "@/lib/utils/date-utils";
import { id } from "zod/v4/locales";

type RecruitmentStatus = "모집중" | "모집 예정" | "모집 마감";

export default function RecruitmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recruitmentId = params.id as string;

  const [recruitment, setRecruitment] = useState<RecruitmentResponse | null>(
    null,
  );
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadRecruitmentData();
  }, [recruitmentId]);

  async function loadRecruitmentData() {
    try {
      setIsLoading(true);
      setError(null);
      const [recruitmentData, applicationsData] = await Promise.all([
        getRecruitmentById(recruitmentId),
        getApplicationsByRecruitmentId(recruitmentId),
      ]);
      setRecruitment(recruitmentData);
      setApplications(applicationsData);
    } catch (error) {
      console.error("Failed to load recruitment:", error);
      setError("모집 공고를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setIsDeleting(true);
      await deleteRecruitment(recruitmentId);
      router.push("/manage/recruitments");
    } catch {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
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

  function getStatusVariant(
    status: RecruitmentStatus,
  ): "default" | "secondary" | "outline" {
    if (status === "모집중") return "default";
    if (status === "모집 예정") return "secondary";
    return "outline";
  }

  // Calculate statistics with new status mapping
  const totalApplicants = applications.filter(
    (app) => app.status !== "CANCELED",
  ).length;
  const acceptedCount = applications.filter(
    (app) => app.status === "PASSED",
  ).length;
  const rejectedCount = applications.filter(
    (app) => app.status === "REJECTED",
  ).length;
  const waitingCount = applications.filter((app) =>
    ["APPLIED", "IN_PROGRESS", "WAITING", "HOLD"].includes(app.status),
  ).length;

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

  if (error || !recruitment) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
          <p className="text-muted-foreground">
            {error || "모집 공고를 찾을 수 없습니다."}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => loadRecruitmentData()} variant="outline">
              다시 시도
            </Button>
            <Button onClick={() => router.push("/manage/recruitments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const status = getRecruitmentStatus();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3 border-b pb-6">
        <Button
          onClick={() => router.push("/manage/recruitments")}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {recruitment.title}
              </h1>
              <Badge variant={getStatusVariant(status)}>{status}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{recruitment.quarter.name}</span>
              <span>•</span>
              <span>
                {formatDate(recruitment.startAt)} ~{" "}
                {formatDate(recruitment.endAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/manage/recruitments/${id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Recruitment Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>모집 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
              <div className="text-sm font-medium text-muted-foreground">
                모집 제목
              </div>
              <div className="text-sm">{recruitment.title}</div>

              <div className="text-sm font-medium text-muted-foreground">
                설명
              </div>
              <div className="text-sm">
                {recruitment.description || "설명 없음"}
              </div>

              <div className="text-sm font-medium text-muted-foreground">
                상태
              </div>
              <div>
                <Badge variant={getStatusVariant(status)}>{status}</Badge>
              </div>

              <div className="text-sm font-medium text-muted-foreground">
                활성 여부
              </div>
              <div>
                <Badge variant={recruitment.active ? "default" : "outline"}>
                  {recruitment.active ? "활성" : "비활성"}
                </Badge>
              </div>

              <div className="text-sm font-medium text-muted-foreground">
                분기
              </div>
              <div className="text-sm">{recruitment.quarter.name}</div>

              <div className="text-sm font-medium text-muted-foreground">
                기간
              </div>
              <div className="text-sm">
                {formatDate(recruitment.startAt)} ~{" "}
                {formatDate(recruitment.endAt)}
              </div>

              <div className="text-sm font-medium text-muted-foreground">
                지원서 양식
              </div>
              <div className="text-sm">{recruitment.form.title}</div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>지원 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>총 지원자</span>
                </div>
                <p className="text-3xl font-bold">{totalApplicants}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>합격</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {acceptedCount}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span>불합격</span>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {rejectedCount}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>대기</span>
                </div>
                <p className="text-3xl font-bold text-gray-600">
                  {waitingCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>지원자 목록</CardTitle>
              <span className="text-sm text-muted-foreground">
                총 {applications.length}건
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ApplicationsTable applications={applications} />
          </CardContent>
        </Card>

        {/* Meta Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>메타 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
              <div className="text-sm font-medium text-muted-foreground">
                생성일
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDateTime(recruitment.createdAt)}
              </div>

              <div className="text-sm font-medium text-muted-foreground">
                수정일
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDateTime(recruitment.modifiedAt)}
              </div>

              <div className="text-sm font-medium text-muted-foreground">
                생성자
              </div>
              <div className="text-sm text-muted-foreground">
                {recruitment.createdBy}
              </div>

              <div className="text-sm font-medium text-muted-foreground">
                수정자
              </div>
              <div className="text-sm text-muted-foreground">
                {recruitment.modifiedBy}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              모집 공고 "{recruitment.title}"을(를) 삭제하면 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
