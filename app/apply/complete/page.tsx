"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, FileText, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRecruitmentCompletionMessage } from "@/lib/api/recruitment";

export default function ApplicationCompletePage() {
  const router = useRouter();
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const recruitmentId = new URLSearchParams(window.location.search).get(
      "recruitmentId",
    );
    if (!recruitmentId) return;

    getRecruitmentCompletionMessage(recruitmentId)
      .then(({ completionMessage: message }) => {
        setCompletionMessage(message?.trim() || null);
      })
      .catch(() => {
        // The submission is already complete, so an optional notice failure is non-blocking.
      });
  }, []);

  return (
    <div className="container mx-auto max-w-2xl py-20 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center text-2xl">
            지원서 제출이 완료되었습니다!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              제출하신 지원서는 정상적으로 접수되었습니다.
            </p>
            <p className="text-muted-foreground">
              결과는 이메일로 안내드릴 예정입니다.
            </p>
          </div>

          {completionMessage && (
            <div className="border-y py-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">안내</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {completionMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold">지원서 확인 경로</p>
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
              <span>홈 화면 지원 안내</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span>지원하러 가기</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-primary">내 지원서 조회</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              위 경로에서 제출 내용을 확인하고, 마감일 전까지 지원서를
              수정하거나 취소할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col-reverse justify-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => router.push("/apply")}
            >
              지원 페이지로 돌아가기
            </Button>
            <Button onClick={() => router.push("/apply/my")}>
              <FileText className="mr-2 h-4 w-4" />내 지원서 조회
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
