"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ApplicationCompletePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const applicationId = searchParams.get("applicationId");

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

          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <p>• 제출 내용은 "내 지원서 조회" 메뉴에서 확인하실 수 있습니다.</p>
            <p>• 검토 시작 전까지 지원서를 수정하거나 취소할 수 있습니다.</p>
            <p>• 추가 문의사항은 학회 이메일로 연락 부탁드립니다.</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {applicationId && (
              <Button
                variant="outline"
                onClick={() => router.push("/apply/my")}
              >
                <FileText className="mr-2 h-4 w-4" />내 지원서 조회
              </Button>
            )}
            <Button onClick={() => router.push("/apply")}>홈으로 이동</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
