"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  approveActivityOpeningRequest,
  getActivityOpeningRequestForManagement,
  reviewActivityOpeningRequest,
} from "@/lib/api/activity-opening-request";
import { ActivityOpeningRequestResponse } from "@/lib/interfaces/activity-opening-request";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("ko-KR") : "—";
}

function messageFor(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  return typeof data === "string" && data.trim() ? data : fallback;
}

export default function ActivityOpeningRequestManagementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<ActivityOpeningRequestResponse | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getActivityOpeningRequestForManagement(id)
      .then((data) => {
        setRequest(data);
        setComment(data.reviewComment ?? "");
      })
      .catch(() => toast.error("개설 신청을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  async function review(status: "REVISION_REQUESTED" | "REJECTED") {
    if (!comment.trim()) {
      toast.error("검토 의견을 입력해주세요.");
      return;
    }
    try {
      setUpdating(true);
      const updated = await reviewActivityOpeningRequest(id, status, comment.trim());
      setRequest(updated);
      toast.success(status === "REJECTED" ? "신청을 반려했습니다." : "보완을 요청했습니다.");
    } catch (error) {
      toast.error(messageFor(error, "검토 상태를 변경하지 못했습니다."));
    } finally {
      setUpdating(false);
    }
  }

  async function approve() {
    try {
      setUpdating(true);
      const updated = await approveActivityOpeningRequest(id, comment.trim() || undefined);
      setRequest(updated);
      toast.success("신청을 승인하고 활동을 등록했습니다.");
    } catch (error) {
      toast.error(messageFor(error, "신청을 승인하지 못했습니다."));
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <div className="mx-auto w-full max-w-5xl px-6 py-12 text-sm text-muted-foreground">신청 내용을 불러오는 중입니다.</div>;
  }
  if (!request) {
    return <div className="mx-auto w-full max-w-5xl px-6 py-12"><p>신청을 찾을 수 없습니다.</p><Button className="mt-4" variant="outline" onClick={() => router.back()}>돌아가기</Button></div>;
  }

  const reviewable = request.status === "SUBMITTED";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => router.push("/manage/activity-opening-requests")}><ArrowLeft className="h-4 w-4" />목록으로</Button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><div className="mb-2 flex items-center gap-2"><ActivityOpeningStatusBadge status={request.status} /><span className="text-sm text-muted-foreground">{request.activityType.name}</span>{request.personalProject && <span className="text-xs font-medium text-[#264638]">개인 프로젝트</span>}</div><h1 className="text-2xl font-bold tracking-tight">{request.title}</h1><p className="mt-2 text-sm text-muted-foreground">{request.applicant.name} · {request.applicant.studentId}</p></div>
        {request.approvedActivityId && <Button asChild><Link href={`/manage/activities/${request.approvedActivityId}`}>등록된 활동 보기</Link></Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">활동 소개 및 목적</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7">{request.description}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">운영 계획</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7">{request.operationPlan}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">참여 예정 학회원</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm font-medium">담당자: {request.applicant.name}</p>{request.initialMembers.length === 0 ? <p className="text-sm text-muted-foreground">추가로 지정한 학회원이 없습니다.</p> : <div className="flex flex-wrap gap-2">{request.initialMembers.map((member) => <span key={member.id} className="rounded-md bg-muted px-2.5 py-1 text-sm">{member.name} <span className="text-xs text-muted-foreground">{member.studentId}</span></span>)}</div>}</CardContent></Card>
        </div>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">신청 정보</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">활동 기간</p><p className="mt-1">{formatDate(request.startDate)} - {formatDate(request.endDate)}</p></div></div><Separator /><div><p className="text-xs text-muted-foreground">분기</p><p className="mt-1">{request.quarter.name}</p></div><div><p className="text-xs text-muted-foreground">공개 범위</p><p className="mt-1">{request.personalProject ? "개인 프로젝트 · 모든 활동 미노출" : "모든 활동에 공개"}</p></div><div><p className="text-xs text-muted-foreground">신규 모집</p><p className="mt-1">{request.acceptsNewMembers ? "진행" : "진행하지 않음"}</p></div><div><p className="text-xs text-muted-foreground">참여 정원</p><p className="mt-1">{request.acceptsNewMembers ? request.participantLimit ? `${request.participantLimit}명` : "제한 없음" : "해당 없음"}</p></div><div><p className="text-xs text-muted-foreground">이전 활동</p><p className="mt-1">{request.parentActivityTitle ?? "해당 없음"}</p></div><div><p className="text-xs text-muted-foreground">제출일</p><p className="mt-1">{formatDate(request.submittedAt)}</p></div></CardContent></Card>

          <Card><CardHeader><CardTitle className="text-base">검토</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="review-comment">검토 의견</Label><Textarea id="review-comment" rows={5} value={comment} onChange={(event) => setComment(event.target.value)} disabled={!reviewable || updating} placeholder="보완할 내용이나 승인 의견을 작성하세요." /></div>{reviewable ? <div className="grid gap-2"><AlertDialog><AlertDialogTrigger asChild><Button disabled={updating}>승인하고 활동 등록</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>신청을 승인할까요?</AlertDialogTitle><AlertDialogDescription>승인 즉시 정식 활동과 초기 참여자가 등록됩니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>돌아가기</AlertDialogCancel><AlertDialogAction onClick={approve}>승인 및 등록</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><Button variant="outline" disabled={updating} onClick={() => review("REVISION_REQUESTED")}>보완 요청</Button><Button variant="destructive" disabled={updating} onClick={() => review("REJECTED")}>반려</Button></div> : <p className="text-sm text-muted-foreground">현재 상태에서는 추가 검토 작업이 필요하지 않습니다.</p>}</CardContent></Card>
        </div>
      </div>
    </div>
  );
}
