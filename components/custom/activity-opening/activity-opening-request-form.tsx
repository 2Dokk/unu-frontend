"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMe } from "@/lib/api/auth";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { getCurrentActivityOpeningPeriod } from "@/lib/api/activity-opening-period";
import { searchActivities } from "@/lib/api/activity";
import {
  createActivityOpeningRequest,
  getActivityOpeningRequest,
  searchActivityOpeningMembers,
  submitActivityOpeningRequest,
  updateActivityOpeningRequest,
} from "@/lib/api/activity-opening-request";
import {
  ActivityResponse,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { UserInfoResponseDto, UserSummaryDto } from "@/lib/interfaces/auth";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { ActivityOpeningRequestPayload } from "@/lib/interfaces/activity-opening-request";
import { ActivityOpeningPeriodResponse } from "@/lib/interfaces/activity-opening-period";
import { useAuth } from "@/lib/contexts/AuthContext";

interface Props {
  requestId?: string;
}

interface FormState {
  title: string;
  description: string;
  operationPlan: string;
  activityTypeId: string;
  quarterId: string;
  startDate: string;
  endDate: string;
  acceptsNewMembers: boolean;
  participantLimit: string;
  personalProject: boolean | null;
  parentActivityId: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  operationPlan: "",
  activityTypeId: "",
  quarterId: "",
  startDate: "",
  endDate: "",
  acceptsNewMembers: false,
  participantLimit: "",
  personalProject: null,
  parentActivityId: "none",
};

function errorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function unavailableMessage(
  period: ActivityOpeningPeriodResponse,
  revision: boolean,
) {
  if (revision && !period.canRevise) {
    return "활동 개설 신청 보완 제출 기간이 마감되었습니다.";
  }
  if (period.status === "UPCOMING" && period.startAt) {
    const start = new Date(period.startAt).toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `활동 개설 신청은 ${start}부터 가능합니다.`;
  }
  if (period.status === "CLOSED") return "이번 분기 활동 개설 신청이 마감되었습니다.";
  if (period.status === "DISABLED") return "현재 활동 개설 신청 접수가 중지되어 있습니다.";
  return "활동 개설 신청 기간이 아직 설정되지 않았습니다.";
}

export function ActivityOpeningRequestForm({ requestId }: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [applicant, setApplicant] = useState<UserInfoResponseDto | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>([]);
  const [quarter, setQuarter] = useState<QuarterResponse | null>(null);
  const [previousActivities, setPreviousActivities] = useState<ActivityResponse[]>([]);
  const [initialMembers, setInitialMembers] = useState<UserSummaryDto[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<UserSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [periodBlockedMessage, setPeriodBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [me, types, activities, existing, openingPeriod] = await Promise.all([
          getMe(),
          getAllActivityTypes(),
          searchActivities({ includeUnlisted: true }),
          requestId ? getActivityOpeningRequest(requestId) : Promise.resolve(null),
          getCurrentActivityOpeningPeriod(),
        ]);
        if (!active) return;
        setApplicant(me);
        setActivityTypes(types.filter((type) => ["PROJECT", "STUDY"].includes(type.code)));
        setPreviousActivities(
          activities.filter((activity) => activity.assignee.id === userId),
        );

        if (existing) {
          if (!["DRAFT", "REVISION_REQUESTED"].includes(existing.status)) {
            toast.error("현재 상태에서는 신청을 수정할 수 없습니다.");
            router.replace("/activity-opening/my");
            return;
          }
          const revision = existing.status === "REVISION_REQUESTED";
          const sameQuarter = openingPeriod.quarter?.id === existing.quarter.id;
          if (!sameQuarter || (revision ? !openingPeriod.canRevise : !openingPeriod.canApply)) {
            setPeriodBlockedMessage(
              sameQuarter
                ? unavailableMessage(openingPeriod, revision)
                : "현재 분기의 활동 개설 신청만 수정할 수 있습니다.",
            );
          }
          setQuarter(existing.quarter);
          setInitialMembers(existing.initialMembers);
          setForm({
            title: existing.title,
            description: existing.description,
            operationPlan: existing.operationPlan,
            activityTypeId: existing.activityType.id,
            quarterId: existing.quarter.id,
            startDate: existing.startDate,
            endDate: existing.endDate,
            acceptsNewMembers: existing.acceptsNewMembers,
            participantLimit: String(existing.participantLimit ?? ""),
            personalProject: existing.personalProject,
            parentActivityId: existing.parentActivityId ?? "none",
          });
        } else {
          if (!openingPeriod.canApply) {
            setPeriodBlockedMessage(unavailableMessage(openingPeriod, false));
          }
          const currentQuarter = await getCurrentQuarter();
          if (!active) return;
          setQuarter(currentQuarter);
          setForm((prev) => ({
            ...prev,
            quarterId: currentQuarter.id,
            startDate: currentQuarter.startDate,
            endDate: currentQuarter.endDate,
          }));
        }
      } catch (error) {
        const message = errorMessage(error, "신청 정보를 불러오지 못했습니다.");
        setPeriodBlockedMessage(message);
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [requestId, router, userId]);

  const availablePreviousActivities = useMemo(() => {
    if (!form.activityTypeId) return previousActivities;
    return previousActivities.filter(
      (activity) => activity.activityType.id === form.activityTypeId,
    );
  }, [form.activityTypeId, previousActivities]);

  const selectedActivityType = useMemo(
    () => activityTypes.find((type) => type.id === form.activityTypeId),
    [activityTypes, form.activityTypeId],
  );
  const projectMode =
    selectedActivityType?.code !== "PROJECT" || form.personalProject === null
      ? null
      : form.personalProject
        ? "PERSONAL"
        : form.acceptsNewMembers
          ? "RECRUITING"
          : "FIXED_TEAM";
  const canSelectInitialMembers =
    Boolean(selectedActivityType) &&
    (selectedActivityType?.code !== "PROJECT" ||
      form.personalProject === false);

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function searchMembers() {
    if (memberQuery.trim().length < 2) {
      toast.error("이름 또는 학번을 2자 이상 입력해주세요.");
      return;
    }
    try {
      setSearching(true);
      const results = await searchActivityOpeningMembers(memberQuery.trim());
      setMemberResults(
        results.filter(
          (result) =>
            result.id !== userId &&
            !initialMembers.some((member) => member.id === result.id),
        ),
      );
    } catch (error) {
      toast.error(errorMessage(error, "학회원 검색에 실패했습니다."));
    } finally {
      setSearching(false);
    }
  }

  function validate(): string | null {
    if (!form.activityTypeId) return "활동 유형을 선택해주세요.";
    if (
      selectedActivityType?.code === "PROJECT" &&
      form.personalProject === null
    )
      return "프로젝트 진행 방식을 선택해주세요.";
    if (!form.title.trim()) return "활동명을 입력해주세요.";
    if (!form.description.trim()) return "활동 소개를 입력해주세요.";
    if (!form.operationPlan.trim()) return "운영 계획을 입력해주세요.";
    if (!form.startDate || !form.endDate) return "활동 기간을 입력해주세요.";
    if (new Date(form.startDate) > new Date(form.endDate))
      return "종료일은 시작일 이후여야 합니다.";
    const participantLimit = Number(form.participantLimit);
    if (
      form.acceptsNewMembers &&
      form.participantLimit &&
      (!Number.isInteger(participantLimit) ||
        participantLimit < 1 ||
        participantLimit > 1000)
    ) {
      return "참여 정원은 1명 이상 1,000명 이하로 입력해주세요.";
    }
    if (
      form.acceptsNewMembers &&
      form.participantLimit &&
      participantLimit < initialMembers.length
    ) {
      return "참여 정원은 함께 시작할 인원보다 적을 수 없습니다.";
    }
    return null;
  }

  async function save(shouldSubmit: boolean) {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload: ActivityOpeningRequestPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      operationPlan: form.operationPlan.trim(),
      activityTypeId: form.activityTypeId,
      quarterId: form.quarterId,
      startDate: form.startDate,
      endDate: form.endDate,
      expectedMemberCount: initialMembers.length + 1,
      acceptsNewMembers: form.acceptsNewMembers,
      participantLimit:
        form.acceptsNewMembers && form.participantLimit
          ? Number(form.participantLimit)
          : undefined,
      personalProject: Boolean(form.personalProject),
      parentActivityId:
        form.parentActivityId === "none" ? undefined : form.parentActivityId,
      initialMemberIds: initialMembers.map((member) => member.id),
    };

    try {
      setSaving(true);
      const saved = requestId
        ? await updateActivityOpeningRequest(requestId, payload)
        : await createActivityOpeningRequest(payload);
      if (shouldSubmit) {
        await submitActivityOpeningRequest(saved.id);
        toast.success("활동 개설 신청을 제출했습니다.");
      } else {
        toast.success("신청서를 임시 저장했습니다.");
      }
      router.push("/activity-opening/my");
    } catch (error) {
      toast.error(errorMessage(error, "신청서를 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto w-full max-w-4xl px-6 py-12 text-sm text-muted-foreground">신청 정보를 불러오는 중입니다.</div>;
  }

  if (periodBlockedMessage) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {requestId ? "활동 개설 신청 수정" : "활동 개설 신청"}
          </h1>
          <p className="text-sm text-muted-foreground">신청 가능한 기간을 확인해주세요.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">현재 신청서를 작성할 수 없습니다.</p>
              <p className="mt-2 text-sm text-muted-foreground">{periodBlockedMessage}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => router.push("/activities")}>모든 활동 보기</Button>
              <Button onClick={() => router.push("/activity-opening/my")}>내 신청 내역</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {requestId ? "활동 개설 신청 수정" : "활동 개설 신청"}
          </h1>
          <p className="text-sm text-muted-foreground">
            제출한 내용은 임원진 검토와 승인 후 정식 활동으로 등록됩니다.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/activity-opening/my")}>
          내 신청 내역
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">신청자</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">이름</p><p className="mt-1 font-medium">{applicant?.name}</p></div>
          <div><p className="text-xs text-muted-foreground">학번</p><p className="mt-1 font-medium">{applicant?.studentId}</p></div>
          <div><p className="text-xs text-muted-foreground">분기</p><p className="mt-1 font-medium">{quarter?.name}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">활동 정보</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>활동 유형</Label>
            <Select
              value={form.activityTypeId}
              onValueChange={(value) =>
                setForm((prev) => {
                  const nextType = activityTypes.find((type) => type.id === value);
                  return {
                    ...prev,
                    activityTypeId: value,
                    parentActivityId: "none",
                    acceptsNewMembers: false,
                    personalProject: nextType?.code === "PROJECT" ? null : false,
                  };
                })
              }
            >
              <SelectTrigger><SelectValue placeholder="활동 유형을 선택하세요" /></SelectTrigger>
              <SelectContent>{activityTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening-title">활동명</Label>
            <Input id="opening-title" maxLength={100} value={form.title} onChange={(event) => change("title", event.target.value)} placeholder="활동명을 입력하세요" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening-description">활동 소개 및 목적</Label>
            <Textarea id="opening-description" rows={5} maxLength={3000} value={form.description} onChange={(event) => change("description", event.target.value)} placeholder="어떤 활동인지, 무엇을 목표로 하는지 작성해주세요." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening-plan">운영 계획</Label>
            <Textarea id="opening-plan" rows={8} maxLength={10000} value={form.operationPlan} onChange={(event) => change("operationPlan", event.target.value)} placeholder="진행 방식, 일정, 예상 결과물을 중심으로 작성해주세요." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="opening-start">시작일</Label><Input id="opening-start" type="date" value={form.startDate} onChange={(event) => change("startDate", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="opening-end">종료일</Label><Input id="opening-end" type="date" value={form.endDate} onChange={(event) => change("endDate", event.target.value)} /></div>
          </div>
          {selectedActivityType?.code === "PROJECT" ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">프로젝트 진행 방식</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  함께 시작할 팀원과 승인 후 추가 모집 여부를 선택해주세요.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  aria-pressed={projectMode === "PERSONAL"}
                  className={`min-h-24 border px-4 py-3 text-left transition-colors ${projectMode === "PERSONAL" ? "border-[#264638] bg-[#264638]/5" : "hover:bg-muted"}`}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      personalProject: true,
                      acceptsNewMembers: false,
                    }));
                    setInitialMembers([]);
                    setMemberResults([]);
                  }}
                >
                  <span className="block text-sm font-medium">개인 프로젝트</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    신청자만 참여하며 모든 활동 목록에는 공개하지 않습니다.
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={projectMode === "FIXED_TEAM"}
                  className={`min-h-24 border px-4 py-3 text-left transition-colors ${projectMode === "FIXED_TEAM" ? "border-[#264638] bg-[#264638]/5" : "hover:bg-muted"}`}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      personalProject: false,
                      acceptsNewMembers: false,
                    }))
                  }
                >
                  <span className="block text-sm font-medium">정해진 팀원과 진행</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    함께 시작할 학회원을 등록하고 추가 신청은 받지 않습니다.
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={projectMode === "RECRUITING"}
                  className={`min-h-24 border px-4 py-3 text-left transition-colors ${projectMode === "RECRUITING" ? "border-[#264638] bg-[#264638]/5" : "hover:bg-muted"}`}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      personalProject: false,
                      acceptsNewMembers: true,
                    }))
                  }
                >
                  <span className="block text-sm font-medium">추가 팀원 모집</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    함께 시작할 학회원을 등록하고 승인 후 추가 신청도 받습니다.
                  </span>
                </button>
              </div>
            </div>
          ) : null}
          {selectedActivityType && selectedActivityType.code !== "PROJECT" && (
              <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">추가 참여자 모집</p>
                  <p className="text-xs text-muted-foreground">
                    함께 시작할 학회원 외에 승인 후 새로운 참여 신청을 받습니다.
                  </p>
                </div>
                <Switch
                  checked={form.acceptsNewMembers}
                  onCheckedChange={(checked) =>
                    change("acceptsNewMembers", checked)
                  }
                />
              </div>
            )}
          {form.acceptsNewMembers && (
            <div className="space-y-2">
              <Label htmlFor="opening-participant-limit">참여 정원</Label>
              <div className="relative max-w-48">
                <Input
                  id="opening-participant-limit"
                  value={form.participantLimit}
                  onChange={(event) =>
                    change(
                      "participantLimit",
                      event.target.value.replace(/\D/g, ""),
                    )
                  }
                  placeholder="제한 없음"
                  inputMode="numeric"
                  className="pr-9"
                  maxLength={4}
                />
                {form.participantLimit && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    명
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                비워두면 제한 없이 신청받습니다. 담당자는 제외하고 함께 시작할
                학회원을 포함한 전체 참여 정원입니다.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label>이어가는 이전 활동</Label>
            <Select value={form.parentActivityId} onValueChange={(value) => change("parentActivityId", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">해당 없음</SelectItem>{availablePreviousActivities.map((activity) => <SelectItem key={activity.id} value={activity.id}>{activity.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {canSelectInitialMembers && <Card>
        <CardHeader><CardTitle className="text-base">함께 시작할 학회원</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {projectMode === "FIXED_TEAM"
              ? "여기에 등록한 학회원과만 시작하며 승인 후 추가 신청은 받지 않습니다."
              : projectMode === "RECRUITING"
                ? "함께 시작할 학회원을 먼저 등록할 수 있으며 승인 후 추가 신청도 받습니다."
                : "신청자는 승인 시 자동으로 활동 담당자와 참여자로 등록됩니다."}
          </p>
          <div className="flex gap-2">
            <Input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); searchMembers(); } }} placeholder="이름 또는 학번 검색" />
            <Button type="button" variant="outline" onClick={searchMembers} disabled={searching}><Search className="h-4 w-4" />검색</Button>
          </div>
          {memberResults.length > 0 && <div className="divide-y rounded-md border">{memberResults.map((member) => <button type="button" key={member.id} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setInitialMembers((prev) => [...prev, member]); setMemberResults((prev) => prev.filter((item) => item.id !== member.id)); }}><span>{member.name}</span><span className="text-xs text-muted-foreground">{member.studentId}</span></button>)}</div>}
          <div className="flex flex-wrap gap-2">{initialMembers.map((member) => <Badge key={member.id} variant="secondary" className="gap-1 py-1">{member.name}<button type="button" aria-label={`${member.name} 제외`} onClick={() => setInitialMembers((prev) => prev.filter((item) => item.id !== member.id))}><X className="h-3 w-3" /></button></Badge>)}</div>
        </CardContent>
      </Card>}

      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <Button type="button" variant="outline" disabled={saving} onClick={() => save(false)}>임시 저장</Button>
        <Button type="button" disabled={saving} onClick={() => save(true)}>{saving ? "처리 중..." : "신청 제출"}</Button>
      </div>
    </div>
  );
}
