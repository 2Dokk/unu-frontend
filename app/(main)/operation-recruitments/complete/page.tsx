"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileSearch, Info } from "lucide-react";
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
    <div className="mx-auto min-h-[70vh] w-full max-w-3xl px-6 py-8 sm:py-12">
      <Button
        variant="ghost"
        className="-ml-3 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/operation-recruitments")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        학회 내부 신청/모집 목록으로
      </Button>

      <main className="pb-16 pt-12 sm:pt-16">
        <section className="border-b pb-10 sm:pb-12">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <p className="mb-3 text-sm font-semibold text-primary">신청 완료</p>
          <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
            신청이 완료되었습니다
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {recruitmentTitle ? (
              <>
                <span className="font-medium text-foreground">
                  {recruitmentTitle}
                </span>
                에 신청서가 정상적으로 제출되었습니다.
              </>
            ) : (
              "신청서가 정상적으로 제출되었습니다."
            )}
          </p>
        </section>

        {completionMessage && (
          <section className="border-b py-8 sm:py-10">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">신청 후 안내</h2>
            </div>
            <div className="whitespace-pre-wrap rounded-md border bg-muted/30 px-5 py-4 text-sm leading-7 text-foreground/80">
              {completionMessage}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-10">
          <div>
            <h2 className="text-base font-semibold">제출한 신청서 확인</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              신청 내용과 처리 상태는 내 신청 내역에서 확인할 수 있습니다.
            </p>
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            onClick={() => router.push("/operation-recruitments/my")}
          >
            <FileSearch className="mr-2 h-4 w-4" />
            내 신청 내역
          </Button>
        </section>
      </main>
    </div>
  );
}
