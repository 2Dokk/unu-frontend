"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getRecruitmentById } from "@/lib/api/recruitment";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import RecruitmentForm from "@/components/custom/recruitment/recruitment-form";

export default function EditRecruitmentPage() {
  const router = useRouter();
  const params = useParams();
  const recruitmentId = params.id as string;

  const [recruitment, setRecruitment] = useState<RecruitmentResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecruitment();
  }, [recruitmentId]);

  async function loadRecruitment() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRecruitmentById(recruitmentId);
      setRecruitment(data);
    } catch (error: any) {
      console.error("Failed to load recruitment:", error);
      setError("모집 공고를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-3 border-b pb-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* 2-col form grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: 모집 정보 card */}
          <div className="space-y-6">
            <div className="rounded-lg border">
              <div className="p-6 border-b">
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>

          {/* Right: 지원서 미리보기 card */}
          <div className="rounded-lg border">
            <div className="p-6 border-b">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="p-6">
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-end pt-6 border-t">
          <div className="flex gap-3">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !recruitment) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                {error || "모집 공고를 찾을 수 없습니다"}
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => loadRecruitment()} variant="outline">
                  다시 시도
                </Button>
                <Button onClick={() => router.push("/manage/recruitments")}>
                  목록으로 돌아가기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">모집 공고 수정하기</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          모집 공고 기본 정보를 수정합니다
        </p>
      </div>

      <RecruitmentForm mode="edit" initialData={recruitment} />
    </div>
  );
}
