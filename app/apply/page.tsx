"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Info, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getActiveRecruitment } from "@/lib/api/recruitment";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import { FormResponse } from "@/lib/interfaces/form";
import { QuarterResponse } from "@/lib/interfaces/quarter";

type RecruitmentStatus = "모집중" | "모집 예정" | "모집 마감";

export default function ApplyPage() {
  const router = useRouter();

  const [recruitment, setRecruitment] = useState<RecruitmentResponse | null>(
    null,
  );
  const [form, setForm] = useState<FormResponse | null>(null);
  const [quarter, setQuarter] = useState<QuarterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveRecruitment();
  }, []);

  async function loadActiveRecruitment() {
    try {
      setIsLoading(true);
      setError(null);
      const recruitmentData = await getActiveRecruitment();
      setRecruitment(recruitmentData);

      setForm(recruitmentData.form);
      setQuarter(recruitmentData.quarter);
    } catch (error) {
      console.error("Failed to load active recruitment:", error);
      setError("현재 진행 중인 모집 공고가 없습니다.");
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

  function getStatusBadge() {
    const status = getRecruitmentStatus();

    if (status === "모집중") {
      return <Badge className="bg-green-500 text-white">모집중</Badge>;
    }
    if (status === "모집 예정") {
      return <Badge variant="secondary">모집 예정</Badge>;
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        모집 마감
      </Badge>
    );
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleApply() {
    if (!recruitment) return;
    // Navigate to application form page
    router.push(`/apply/form`);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !recruitment) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                {error || "현재 진행 중인 모집 공고가 없습니다."}
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => loadActiveRecruitment()}
                  variant="outline"
                >
                  다시 시도
                </Button>
                <Button onClick={() => router.push("/")}>
                  홈으로 돌아가기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getRecruitmentStatus();
  const canApply = status === "모집중" && recruitment.active;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-5xl w-7xl py-12 px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>

        <div className="space-y-8">
          {/* SECTION 1: Header */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold flex-1">
                {recruitment.title}
              </h1>
              {getStatusBadge()}
            </div>

            {/* Meta Info */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>
                  {formatDate(recruitment.startAt)} ~{" "}
                  {formatDate(recruitment.endAt)}
                </span>
              </div>
              {quarter && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {quarter.year}년 {quarter.name}
                  </Badge>
                </div>
              )}
            </div>

            {!recruitment.active && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  이 모집은 현재 비활성 상태입니다
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* SECTION 2: Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">모집 안내</h2>
            {recruitment.description ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {recruitment.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                상세 안내가 제공되지 않았습니다.
              </p>
            )}
          </div>

          {/* SECTION 3: Apply CTA */}
          <div className="bg-background rounded-lg border shadow-sm p-6 space-y-5">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">지원하기</h2>
              <p className="text-sm text-muted-foreground">
                {canApply
                  ? "아래 버튼을 눌러 지원서를 작성할 수 있습니다."
                  : status === "모집 예정"
                    ? "모집 시작 후 신청할 수 있습니다."
                    : status === "모집 마감"
                      ? "모집이 마감되었습니다."
                      : "현재 신청할 수 없습니다."}
              </p>
            </div>

            {/* Key Info */}
            {canApply && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    모집 마감
                  </span>
                  <span className="font-medium">
                    {formatDateTime(recruitment.endAt)}
                  </span>
                </div>
              </div>
            )}

            {/* Primary CTA */}
            <div className="space-y-3 pt-2">
              <Button
                size="lg"
                className="w-full text-base font-semibold"
                disabled={!canApply}
                onClick={handleApply}
              >
                지원서 작성하기
              </Button>

              {/* Secondary Action */}
              <Button
                size="default"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/apply/my")}
              >
                <FileText className="mr-2 h-4 w-4" />내 지원서 조회
              </Button>
            </div>

            {!canApply && !recruitment.active && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                이 모집은 관리자에 의해 비활성화되었습니다.
              </p>
            )}
          </div>

          {/* SECTION 4: Notice */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>안내사항</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 pl-6">
              <li>지원서는 모집 기간 내에만 제출할 수 있습니다.</li>
              <li>
                제출 후 내용 확인 및 수정은 "내 지원서 조회" 메뉴를
                이용해주세요.
              </li>
              <li>문의사항이 있으시면 학회 관리자에게 연락해주세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
