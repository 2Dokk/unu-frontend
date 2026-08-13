"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, FilePenLine, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ActivityOpeningStatusBadge } from "@/components/custom/activity-opening/activity-opening-status-badge";
import {
  cancelActivityOpeningRequest,
  getMyActivityOpeningRequests,
} from "@/lib/api/activity-opening-request";
import { getCurrentActivityOpeningPeriod } from "@/lib/api/activity-opening-period";
import { ActivityOpeningRequestResponse } from "@/lib/interfaces/activity-opening-request";
import { ActivityOpeningPeriodResponse } from "@/lib/interfaces/activity-opening-period";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ko-KR");
}

export default function MyActivityOpeningRequestsPage() {
  const [requests, setRequests] = useState<ActivityOpeningRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [openingPeriod, setOpeningPeriod] =
    useState<ActivityOpeningPeriodResponse | null>(null);

  useEffect(() => {
    getMyActivityOpeningRequests()
      .then(setRequests)
      .catch(() => toast.error("신청 내역을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getCurrentActivityOpeningPeriod()
      .then(setOpeningPeriod)
      .catch(() => toast.error("활동 개설 신청 기간을 불러오지 못했습니다."));
  }, []);

  async function cancelRequest(id: string) {
    try {
      setCancelingId(id);
      const updated = await cancelActivityOpeningRequest(id);
      setRequests((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success("활동 개설 신청을 취소했습니다.");
    } catch (error) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      toast.error(typeof data === "string" ? data : "신청을 취소하지 못했습니다.");
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-8">
      <Button variant="ghost" size="sm" className="-ml-3" asChild>
        <Link href="/activities">
          <ArrowLeft className="h-4 w-4" />
          학회 활동 보기
        </Link>
      </Button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">내 활동 개설 신청</h1>
          <p className="text-sm text-muted-foreground">신청 상태와 운영진 검토 의견을 확인할 수 있습니다.</p>
        </div>
        {openingPeriod?.canApply ? (
          <Button asChild><Link href="/activity-opening/apply"><Plus className="h-4 w-4" />새 신청</Link></Button>
        ) : (
          <Button disabled><Plus className="h-4 w-4" />새 신청</Button>
        )}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">신청 내역을 불러오는 중입니다.</p>
      ) : requests.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-4 py-14 text-center"><FilePenLine className="h-8 w-8 text-muted-foreground" /><div><p className="font-medium">아직 신청 내역이 없습니다.</p><p className="mt-1 text-sm text-muted-foreground">새 활동을 제안하고 운영진 검토를 요청해보세요.</p></div></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const editable = request.quarter.id === openingPeriod?.quarter?.id && (
              (request.status === "DRAFT" && openingPeriod.canApply) ||
              (request.status === "REVISION_REQUESTED" && openingPeriod.canRevise)
            );
            const cancelable = ["DRAFT", "SUBMITTED", "REVISION_REQUESTED"].includes(request.status);
            return (
              <Card key={request.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2"><ActivityOpeningStatusBadge status={request.status} /><span className="text-xs text-muted-foreground">{request.activityType.name}</span>{request.personalProject && <span className="text-xs font-medium text-[#264638]">개인 프로젝트</span>}</div>
                      <h2 className="break-words text-base font-semibold">{request.title}</h2>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{formatDate(request.startDate)} - {formatDate(request.endDate)}</div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {editable && <Button size="sm" variant="outline" asChild><Link href={`/activity-opening/${request.id}/edit`}>수정</Link></Button>}
                      {request.approvedActivityId && <Button size="sm" asChild><Link href={`/activities/${request.approvedActivityId}`}>등록된 활동 보기</Link></Button>}
                      {cancelable && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="ghost" disabled={cancelingId === request.id}>신청 취소</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>활동 개설 신청을 취소할까요?</AlertDialogTitle><AlertDialogDescription>취소한 신청은 다시 제출하거나 수정할 수 없습니다.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>돌아가기</AlertDialogCancel><AlertDialogAction onClick={() => cancelRequest(request.id)}>신청 취소</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  {request.reviewComment && <div className="rounded-md bg-muted px-4 py-3"><p className="text-xs font-medium text-muted-foreground">운영진 검토 의견</p><p className="mt-1 whitespace-pre-wrap text-sm">{request.reviewComment}</p></div>}
                  <p className="text-xs text-muted-foreground">{request.submittedAt ? `제출 ${formatDate(request.submittedAt)}` : `저장 ${formatDate(request.createdAt)}`}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
