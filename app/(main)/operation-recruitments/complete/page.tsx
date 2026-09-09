"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getOperationRecruitmentById,
  getOperationRecruitmentCompletionMessage,
} from "@/lib/api/recruitment";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function OperationRecruitmentCompletePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [recruitmentTitle, setRecruitmentTitle] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=%2Foperation-recruitments");
      return;
    }

    const recruitmentId = new URLSearchParams(window.location.search).get(
      "recruitmentId",
    );
    if (!recruitmentId) return;

    void getOperationRecruitmentById(recruitmentId)
      .then((result) => setRecruitmentTitle(result.title))
      .catch(() => setRecruitmentTitle(null));

    void getOperationRecruitmentCompletionMessage(recruitmentId)
      .then((result) => setCompletionMessage(result.completionMessage))
      .catch(() => setCompletionMessage(null));
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="mx-auto min-h-[70vh] w-full max-w-2xl px-6 py-8 sm:py-12">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/operation-recruitments")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        학회 내부 신청/모집
      </Button>

      <main className="pb-16 pt-6 sm:pt-8">
        <section>
          <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-700">
            <Check className="h-8 w-8" strokeWidth={2.2} />
          </div>
          {recruitmentTitle && (
            <p className="mb-3 break-words text-sm font-semibold text-primary">
              {recruitmentTitle}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            신청이 접수되었습니다.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            제출 내용과 진행 상태는 내 신청 내역에서 확인할 수 있습니다.
          </p>
        </section>

        {completionMessage && (
          <section className="mt-10 rounded-md border bg-muted/25 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">안내사항</h2>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                  {completionMessage}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mt-10 flex justify-end border-t pt-6">
          <Button
            className="group w-full sm:w-auto"
            onClick={() => router.push("/operation-recruitments/my")}
          >
            내 신청서 확인
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </div>
      </main>
    </div>
  );
}
