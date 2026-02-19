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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecruitmentById } from "@/lib/api/recruitment";
import { getApplicationsByRecruitmentId } from "@/lib/api/application";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import { ApplicationResponse } from "@/lib/interfaces/application";
import ApplicationsTable from "@/components/custom/application/application-table";

type RecruitmentStatus = "모집중" | "모집 예정" | "모집 마감";

export default function RecruitmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recruitmentId = Number(params.id);

  const [recruitment, setRecruitment] = useState<RecruitmentResponse | null>(
    null,
  );
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  function getRecruitmentStatus(): RecruitmentStatus {
    if (!recruitment) return "모집 마감";

    const now = new Date();
    const start = new Date(recruitment.startAt);
    const end = new Date(recruitment.endAt);

    if (now < start) return "모집 예정";
    if (now > end) return "모집 마감";
    return "모집중";
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}.${month}.${day} ${hours}:${minutes}`;
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
          <Button
            onClick={() =>
              router.push(`/manage/recruitments/${recruitmentId}/edit`)
            }
            variant="outline"
            size="sm"
          >
            <Edit className="mr-2 h-4 w-4" />
            수정
          </Button>
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
    </div>
  );
}
