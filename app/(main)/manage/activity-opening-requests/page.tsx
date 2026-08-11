"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActivityOpeningStatusBadge } from "@/components/custom/activity-opening/activity-opening-status-badge";
import { getActivityOpeningRequestsForManagement } from "@/lib/api/activity-opening-request";
import {
  getCurrentActivityOpeningPeriodForManagement,
  updateCurrentActivityOpeningPeriod,
} from "@/lib/api/activity-opening-period";
import {
  ActivityOpeningPeriodResponse,
  ActivityOpeningPeriodStatus,
} from "@/lib/interfaces/activity-opening-period";
import {
  ACTIVITY_OPENING_STATUS_LABEL,
  ActivityOpeningRequestResponse,
  ActivityOpeningRequestStatus,
} from "@/lib/interfaces/activity-opening-request";

const PERIOD_STATUS_LABEL: Record<ActivityOpeningPeriodStatus, string> = {
  NOT_CONFIGURED: "미설정",
  DISABLED: "접수 중지",
  UPCOMING: "접수 예정",
  OPEN: "접수 중",
  CLOSED: "접수 마감",
};

interface PeriodForm {
  startAt: string;
  endAt: string;
  revisionEndAt: string;
  enabled: boolean;
}

const EMPTY_PERIOD_FORM: PeriodForm = {
  startAt: "",
  endAt: "",
  revisionEndAt: "",
  enabled: true,
};

function toDateTimeInput(value?: string | null) {
  return value ? value.slice(0, 16) : "";
}

function periodFormOf(period: ActivityOpeningPeriodResponse): PeriodForm {
  return {
    startAt: toDateTimeInput(period.startAt),
    endAt: toDateTimeInput(period.endAt),
    revisionEndAt: toDateTimeInput(period.revisionEndAt),
    enabled: period.status === "NOT_CONFIGURED" ? true : period.enabled,
  };
}

function errorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return fallback;
}

export default function ActivityOpeningRequestsManagementPage() {
  const [requests, setRequests] = useState<ActivityOpeningRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState<ActivityOpeningPeriodResponse | null>(null);
  const [periodForm, setPeriodForm] = useState<PeriodForm>(EMPTY_PERIOD_FORM);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodSaving, setPeriodSaving] = useState(false);

  useEffect(() => {
    getActivityOpeningRequestsForManagement()
      .then(setRequests)
      .catch(() => toast.error("개설 신청 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getCurrentActivityOpeningPeriodForManagement()
      .then((data) => {
        setPeriod(data);
        setPeriodForm(periodFormOf(data));
      })
      .catch(() => toast.error("활동 개설 신청 기간을 불러오지 못했습니다."))
      .finally(() => setPeriodLoading(false));
  }, []);

  async function savePeriod() {
    if (!periodForm.startAt || !periodForm.endAt || !periodForm.revisionEndAt) {
      toast.error("신청 기간과 보완 제출 마감을 모두 입력해주세요.");
      return;
    }
    try {
      setPeriodSaving(true);
      const updated = await updateCurrentActivityOpeningPeriod(periodForm);
      setPeriod(updated);
      setPeriodForm(periodFormOf(updated));
      toast.success("활동 개설 신청 기간을 저장했습니다.");
    } catch (error) {
      toast.error(errorMessage(error, "활동 개설 신청 기간을 저장하지 못했습니다."));
    } finally {
      setPeriodSaving(false);
    }
  }

  const filtered = useMemo(() => requests.filter((request) => {
    const matchesQuery = !query.trim() || request.title.toLowerCase().includes(query.trim().toLowerCase()) || request.applicant.name.includes(query.trim());
    const matchesStatus = status === "all" || request.status === status;
    return matchesQuery && matchesStatus;
  }), [query, requests, status]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="space-y-2"><h1 className="text-2xl font-bold tracking-tight">활동 개설 신청 관리</h1><p className="text-sm text-muted-foreground">학회원이 제출한 활동 계획을 검토하고 정식 활동으로 등록합니다.</p></div>
      <Card>
        <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" />
              개설 신청 기간
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {period?.quarter?.name ?? "현재 분기 미설정"} 학회원 신청과 보완 제출 기간을 관리합니다.
            </p>
          </div>
          {period && (
            <span className={`w-fit border px-2.5 py-1 text-xs font-medium ${period.status === "OPEN" ? "border-[#264638]/30 bg-[#264638]/5 text-[#264638]" : "text-muted-foreground"}`}>
              {PERIOD_STATUS_LABEL[period.status]}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {periodLoading ? (
            <p className="py-6 text-sm text-muted-foreground">기간 설정을 불러오는 중입니다.</p>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="opening-period-start">신청 시작</Label>
                  <Input id="opening-period-start" type="datetime-local" value={periodForm.startAt} onChange={(event) => setPeriodForm((prev) => ({ ...prev, startAt: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opening-period-end">신청 마감</Label>
                  <Input id="opening-period-end" type="datetime-local" value={periodForm.endAt} onChange={(event) => setPeriodForm((prev) => ({ ...prev, endAt: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opening-revision-end">보완 제출 마감</Label>
                  <Input id="opening-revision-end" type="datetime-local" value={periodForm.revisionEndAt} onChange={(event) => setPeriodForm((prev) => ({ ...prev, revisionEndAt: event.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4 border-t pt-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <Switch id="opening-period-enabled" checked={periodForm.enabled} onCheckedChange={(enabled) => setPeriodForm((prev) => ({ ...prev, enabled }))} />
                  <Label htmlFor="opening-period-enabled" className="cursor-pointer">신청 접수 활성화</Label>
                </div>
                <Button onClick={savePeriod} disabled={periodSaving || !period?.quarter}>
                  <Save className="h-4 w-4" />
                  {periodSaving ? "저장 중..." : "기간 저장"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="활동명 또는 신청자 검색" /></div>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">전체 상태</SelectItem>{Object.entries(ACTIVITY_OPENING_STATUS_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          </div>
          {loading ? <p className="py-12 text-center text-sm text-muted-foreground">신청 목록을 불러오는 중입니다.</p> : filtered.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">조건에 맞는 신청이 없습니다.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>활동명</TableHead><TableHead className="hidden md:table-cell">유형</TableHead><TableHead>신청자</TableHead><TableHead className="hidden lg:table-cell">제출일</TableHead><TableHead className="text-center">상태</TableHead><TableHead className="w-20">검토</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map((request) => <TableRow key={request.id}><TableCell className="max-w-xs whitespace-normal break-words font-medium">{request.title}</TableCell><TableCell className="hidden md:table-cell">{request.activityType.name}</TableCell><TableCell>{request.applicant.name}</TableCell><TableCell className="hidden text-muted-foreground lg:table-cell">{request.submittedAt ? new Date(request.submittedAt).toLocaleDateString("ko-KR") : "—"}</TableCell><TableCell className="text-center"><ActivityOpeningStatusBadge status={request.status as ActivityOpeningRequestStatus} /></TableCell><TableCell><Button size="sm" variant="outline" asChild><Link href={`/manage/activity-opening-requests/${request.id}`}>보기</Link></Button></TableCell></TableRow>)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
