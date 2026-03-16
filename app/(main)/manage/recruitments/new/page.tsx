"use client";
import RecruitmentForm from "@/components/custom/recruitment/recruitment-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewRecruitmentPage() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">모집 공고 생성하기</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          모집 기간과 지원서 양식을 선택하여 모집 공고를 생성합니다
        </p>
      </div>

      <RecruitmentForm mode="create" />
    </div>
  );
}
