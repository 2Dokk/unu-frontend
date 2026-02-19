"use client";
import RecruitmentForm from "@/components/custom/recruitment/recruitment-form";
import { Button } from "@/components/ui/button copy";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewRecruitmentPage() {
  const router = useRouter();

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

        <h1 className="text-2xl font-bold tracking-tight">모집 공고 생성</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          모집 기간과 사용할 지원서 양식을 선택하세요.
        </p>
      </div>

      <RecruitmentForm mode="create" />
    </div>
  );
}
