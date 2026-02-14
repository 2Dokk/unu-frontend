"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getRecruitmentById } from "@/lib/api/recruitment";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import RecruitmentForm from "../../components/RecruitmentForm";

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
    <div>
      {/* Breadcrumb */}
      <div className="container mx-auto max-w-7xl py-4 px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => router.push("/manage/recruitments")}
            className="hover:text-foreground transition-colors"
          >
            모집관리
          </button>
          <span>/</span>
          <button
            onClick={() => router.push(`/manage/recruitments/${recruitmentId}`)}
            className="hover:text-foreground transition-colors"
          >
            상세
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">수정</span>
        </div>
      </div>

      <RecruitmentForm mode="edit" initialData={recruitment} />
    </div>
  );
}
