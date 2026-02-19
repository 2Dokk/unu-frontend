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
  const recruitmentId = Number(params.id);

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
    } catch (error) {
      console.error("Failed to load recruitment:", error);
      setError("모집 공고를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-12" />
            </div>
            <Skeleton className="h-96" />
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
                {error || "모집 공고를 찾을 수 없습니다."}
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

        <h1 className="text-2xl font-bold tracking-tight">모집 공고 수정</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          모집 기간과 사용할 지원서 양식을 선택하세요.
        </p>
      </div>

      <RecruitmentForm mode="edit" initialData={recruitment} />
    </div>
  );
}
