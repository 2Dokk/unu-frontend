"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createActivity } from "@/lib/api/activity";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getAllQuarters } from "@/lib/api/quarter";
import { getAllUsers } from "@/lib/api/user";
import { createActivityParticipant } from "@/lib/api/activity-participant";
import {
  ActivityRequest,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { ParticipantsCard } from "@/components/custom/activity/participants-card";
import {
  PROJECT_MODE_OPTIONS,
  ProjectMode,
  projectModeFields,
} from "@/lib/constants/project-mode";
import { isDiscordUrl, supportsDiscordLink } from "@/lib/constants/discord-link";
import { operationPlanLabel } from "@/lib/constants/operation-plan";
import { activityMaterialLabel } from "@/lib/constants/activity-material";
import { isMaterialUrl } from "@/lib/utils/material-url";

const STATUS_OPTIONS = [
  { value: "CREATED", label: "준비 중" },
  { value: "OPEN", label: "모집 중" },
  { value: "ONGOING", label: "진행 중" },
  { value: "COMPLETED", label: "종료" },
];

export default function ActivityNewPage() {
  const router = useRouter();

  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newParticipantIds, setNewParticipantIds] = useState<string[]>([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "CREATED",
    activityTypeId: "",
    assigneeId: "",
    quarterId: "",
    startDate: "",
    endDate: "",
    depositAmount: "30000",
    participantLimit: "",
    recruitmentPositions: "",
    discordUrl: "",
    recruitmentStartDate: "",
    recruitmentEndDate: "",
    operationPlan: "",
    instructorCareer: "",
    materialUrl: "",
  });
  const [projectMode, setProjectMode] = useState<ProjectMode>("FIXED_TEAM");

  const selectedActivityType = activityTypes.find(
    (type) => type.id === formData.activityTypeId,
  );
  const requiresDeposit =
    selectedActivityType?.code === "STUDY" ||
    selectedActivityType?.code === "SPECIAL_LECTURE";
  const isProject = selectedActivityType?.code === "PROJECT";
  // 스터디는 담당자도 참여자로 자동 등록되므로 정원에 포함된다.
  const countsAssignee = selectedActivityType?.code === "STUDY";
  const allowsDiscordLink = supportsDiscordLink(selectedActivityType?.code);
  const planLabel = operationPlanLabel(selectedActivityType?.code);
  const isSpecialLecture = selectedActivityType?.code === "SPECIAL_LECTURE";
  const materialLabel = activityMaterialLabel(selectedActivityType?.code);
  const modeFields = projectModeFields(projectMode);
  const allowsInitialMembers = !isProject || modeFields.allowsInitialMembers;
  const showsParticipantLimit = !isProject || modeFields.allowsParticipantLimit;

  function handleProjectModeChange(mode: ProjectMode) {
    setProjectMode(mode);
    const fields = projectModeFields(mode);
    setFormData((prev) => ({
      ...prev,
      status: fields.status,
      participantLimit: fields.allowsParticipantLimit
        ? prev.participantLimit
        : "",
      recruitmentPositions:
        mode === "RECRUITING" ? prev.recruitmentPositions : "",
    }));
    if (!fields.allowsInitialMembers) setNewParticipantIds([]);
  }

  useEffect(() => {
    async function loadData() {
      const [typesData, quartersData, usersData] = await Promise.all([
        getAllActivityTypes(),
        getAllQuarters(),
        getAllUsers(),
      ]);
      setActivityTypes(typesData);
      setQuarters(quartersData);
      setUsers(usersData);
    }
    loadData();
  }, []);

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function validateForm(): string | null {
    if (!formData.activityTypeId) return "활동 유형을 선택해주세요.";
    if (!formData.title.trim()) return "활동명을 입력해주세요.";
    if (!formData.startDate || !formData.endDate)
      return "시작일과 종료일을 입력해주세요.";
    if (new Date(formData.startDate) > new Date(formData.endDate))
      return "종료일은 시작일 이후여야 합니다.";
    if (!formData.quarterId) return "분기를 선택해주세요.";
    if (!formData.assigneeId) return "담당자를 선택해주세요.";
    const depositAmount = Number(formData.depositAmount);
    if (
      requiresDeposit &&
      (!formData.depositAmount ||
        !Number.isInteger(depositAmount) ||
        depositAmount < 0 ||
        depositAmount > 1_000_000)
    ) {
      return "참여 보증금은 0원 이상 1,000,000원 이하로 입력해주세요.";
    }
    const participantLimit = Number(formData.participantLimit);
    if (
      formData.participantLimit &&
      (!Number.isInteger(participantLimit) ||
        participantLimit < 1 ||
        participantLimit > 1000)
    ) {
      return "참여 정원은 1명 이상 1,000명 이하로 입력해주세요.";
    }
    if (
      formData.participantLimit &&
      participantLimit <
        newParticipantIds.filter((userId) => userId !== formData.assigneeId)
          .length +
          (countsAssignee ? 1 : 0)
    ) {
      return countsAssignee
        ? "참여 정원은 담당자를 포함한 참여자 수보다 적을 수 없습니다."
        : "참여 정원은 미리 추가한 참여자 수보다 적을 수 없습니다.";
    }
    if (
      Boolean(formData.recruitmentStartDate) !==
      Boolean(formData.recruitmentEndDate)
    ) {
      return "모집 시작일과 종료일을 모두 입력해주세요.";
    }
    if (
      formData.recruitmentStartDate &&
      formData.recruitmentEndDate &&
      formData.recruitmentEndDate < formData.recruitmentStartDate
    ) {
      return "모집 종료일은 모집 시작일보다 빠를 수 없습니다.";
    }
    if (
      formData.recruitmentEndDate &&
      formData.startDate &&
      formData.recruitmentEndDate > formData.startDate
    ) {
      return "모집 종료일은 활동 시작일 이후로 설정할 수 없습니다.";
    }
    if (
      allowsDiscordLink &&
      formData.discordUrl.trim() &&
      !isDiscordUrl(formData.discordUrl.trim())
    ) {
      return "디스코드 초대 링크를 확인해주세요.";
    }
    if (
      materialLabel &&
      formData.materialUrl.trim() &&
      !isMaterialUrl(formData.materialUrl.trim())
    ) {
      return `${materialLabel} Google Drive 또는 Notion 공유 링크를 확인해주세요.`;
    }
    return null;
  }

  async function handleSave() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const data: ActivityRequest = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        activityTypeId: formData.activityTypeId,
        assigneeId: formData.assigneeId,
        quarterId: formData.quarterId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        depositAmount: requiresDeposit
          ? Number(formData.depositAmount)
          : undefined,
        participantLimit: formData.participantLimit
          ? Number(formData.participantLimit)
          : undefined,
        listed: isProject ? modeFields.listed : undefined,
        recruitmentPositions:
          projectMode === "RECRUITING" && isProject
            ? formData.recruitmentPositions.trim() || undefined
            : undefined,
        discordUrl: allowsDiscordLink
          ? formData.discordUrl.trim() || undefined
          : undefined,
        recruitmentStartDate: formData.recruitmentStartDate || undefined,
        recruitmentEndDate: formData.recruitmentEndDate || undefined,
        operationPlan: planLabel
          ? formData.operationPlan.trim() || undefined
          : undefined,
        instructorCareer: isSpecialLecture
          ? formData.instructorCareer.trim() || undefined
          : undefined,
        materialUrl: materialLabel
          ? formData.materialUrl.trim() || undefined
          : undefined,
      };

      const created = await createActivity(data);
      const participantIdsToAdd = countsAssignee
        ? newParticipantIds.filter((userId) => userId !== formData.assigneeId)
        : newParticipantIds;
      if (participantIdsToAdd.length > 0) {
        await Promise.all(
          participantIdsToAdd.map((userId) =>
            createActivityParticipant({
              activityId: created.id,
              userId,
              status: "APPROVED",
            }),
          ),
        );
      }
      router.push(`/manage/activities/${created.id}`);
    } catch (err) {
      console.error("Failed to create activity:", err);
      setError("활동 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">활동 생성하기</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          새로운 활동을 등록합니다
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* 기본 정보 Card */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Activity Type */}
            <div className="space-y-2">
              <Label htmlFor="activityType">
                활동 유형 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.activityTypeId}
                onValueChange={(value) => {
                  handleInputChange("activityTypeId", value);
                  const type = activityTypes.find((item) => item.id === value);
                  if (
                    (type?.code === "STUDY" ||
                      type?.code === "SPECIAL_LECTURE") &&
                    !formData.depositAmount
                  ) {
                    handleInputChange("depositAmount", "30000");
                  }
                  if (type?.code === "LECTURE" && !formData.participantLimit) {
                    handleInputChange("participantLimit", "5");
                  }
                  if (type?.code === "PROJECT") {
                    handleProjectModeChange(projectMode);
                  }
                }}
              >
                <SelectTrigger id="activityType" className="w-48">
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                활동명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="활동명을 입력하세요"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="활동 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiresDeposit && (
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">참여 보증금</Label>
                  <div className="relative w-48">
                    <Input
                      id="depositAmount"
                      value={formData.depositAmount}
                      onChange={(event) =>
                        handleInputChange(
                          "depositAmount",
                          event.target.value.replace(/\D/g, ""),
                        )
                      }
                      inputMode="numeric"
                      className="pr-9"
                      maxLength={7}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      원
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    0원으로 설정하면 보증금 절차를 사용하지 않습니다.
                  </p>
                </div>
              )}

              {isProject && (
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium">프로젝트 진행 방식</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PROJECT_MODE_OPTIONS.map((option) => (
                      <button
                        key={option.mode}
                        type="button"
                        aria-pressed={projectMode === option.mode}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          projectMode === option.mode
                            ? "border-[#264638] bg-[#264638]/5 text-[#264638]"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => handleProjectModeChange(option.mode)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {
                      PROJECT_MODE_OPTIONS.find(
                        (option) => option.mode === projectMode,
                      )?.description
                    }
                  </p>
                </div>
              )}

              {isProject && projectMode === "RECRUITING" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="recruitmentPositions">희망 포지션</Label>
                  <Textarea
                    id="recruitmentPositions"
                    value={formData.recruitmentPositions}
                    onChange={(event) =>
                      handleInputChange(
                        "recruitmentPositions",
                        event.target.value,
                      )
                    }
                    placeholder="예: 프론트엔드 1명 (React), 백엔드 1명 (Spring), 디자이너 1명"
                    rows={2}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    어떤 포지션의 팀원을 찾는지 적어두면 신청자가 활동 상세에서
                    확인할 수 있습니다.
                  </p>
                </div>
              )}

              {allowsDiscordLink && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="discordUrl">디스코드 링크 (선택)</Label>
                  <Input
                    id="discordUrl"
                    type="url"
                    value={formData.discordUrl}
                    onChange={(event) =>
                      handleInputChange("discordUrl", event.target.value)
                    }
                    placeholder="https://discord.gg/..."
                    maxLength={2048}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    입력하면 활동 상세의 활동 내용 탭에 참여 링크로 표시됩니다.
                  </p>
                </div>
              )}

              {isSpecialLecture && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="instructorCareer">강의자 경력</Label>
                  <Textarea
                    id="instructorCareer"
                    rows={4}
                    maxLength={2000}
                    value={formData.instructorCareer}
                    onChange={(event) =>
                      handleInputChange("instructorCareer", event.target.value)
                    }
                    placeholder="관련 프로젝트, 인턴십, 수상, 학습 경험 등"
                  />
                </div>
              )}

              {planLabel && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="operationPlan">{planLabel}</Label>
                  <Input
                    id="study-plan-link"
                    type="url"
                    value={formData.operationPlan}
                    onChange={(event) => handleInputChange("operationPlan", event.target.value)}
                    placeholder="Google Drive·Docs 또는 Notion 공유 링크"
                  />
                </div>
              )}

              {materialLabel && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="materialUrl">{materialLabel} (선택)</Label>
                  <Input
                    id="materialUrl"
                    type="url"
                    maxLength={2048}
                    value={formData.materialUrl}
                    onChange={(event) =>
                      handleInputChange("materialUrl", event.target.value)
                    }
                    placeholder="Google Drive·Docs 또는 Notion 공유 링크"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    학회원이 열람할 수 있도록 공유 권한을 확인해주세요. 등록
                    후 활동 상세와 강의자료 탭에 표시됩니다.
                  </p>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label>모집 기간 (선택)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    className="w-44"
                    value={formData.recruitmentStartDate}
                    onChange={(event) =>
                      handleInputChange(
                        "recruitmentStartDate",
                        event.target.value,
                      )
                    }
                  />
                  <span className="text-sm text-muted-foreground">~</span>
                  <Input
                    type="date"
                    className="w-44"
                    value={formData.recruitmentEndDate}
                    onChange={(event) =>
                      handleInputChange(
                        "recruitmentEndDate",
                        event.target.value,
                      )
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  이 기간에만 참여 신청을 받습니다. 비워두면 모집을 진행하지
                  않습니다. 종료일은 활동 시작일 이후로 설정할 수 없습니다.
                </p>
              </div>

              {/* Quarter */}
              <div className="space-y-2">
                <Label htmlFor="quarter">
                  분기
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.quarterId}
                  onValueChange={(value) =>
                    handleInputChange("quarterId", value)
                  }
                >
                  <SelectTrigger id="quarter" className="w-48">
                    <SelectValue placeholder="분기 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {quarters.map((quarter) => (
                      <SelectItem key={quarter.id} value={quarter.id}>
                        {quarter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isProject && !showsParticipantLimit && (
                <div className="space-y-2">
                  <Label>참여 정원</Label>
                  <p className="text-sm">
                    {projectMode === "PERSONAL"
                      ? "담당자 혼자 진행하므로 정원을 설정하지 않습니다."
                      : `함께 시작할 팀원 ${newParticipantIds.length}명으로 확정되며, 추가 신청은 받지 않습니다.`}
                  </p>
                </div>
              )}

              <div className={showsParticipantLimit ? "space-y-2" : "hidden"}>
                <Label htmlFor="participantLimit">참여 정원</Label>
                <div className="relative w-48">
                  <Input
                    id="participantLimit"
                    value={formData.participantLimit}
                    onChange={(event) =>
                      handleInputChange(
                        "participantLimit",
                        event.target.value.replace(/\D/g, ""),
                      )
                    }
                    placeholder="제한 없음"
                    inputMode="numeric"
                    className="pr-9"
                    maxLength={4}
                  />
                  {formData.participantLimit && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      명
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedActivityType?.code === "LECTURE"
                    ? "인강 활동은 기본 정원이 5명이며 담당자는 제외됩니다."
                    : countsAssignee
                      ? "비워두면 제한이 없으며 담당자도 참여자로 등록되어 정원에 포함됩니다."
                      : "비워두면 제한이 없으며 담당자는 정원에서 제외됩니다."}
                  {isProject &&
                    newParticipantIds.length > 0 &&
                    ` 현재 ${newParticipantIds.length}명을 미리 추가했습니다.`}
                </p>
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <Label>
                  담당자
                  <span className="text-destructive">*</span>
                </Label>
                <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-48 justify-between font-normal text-xs"
                    >
                      <span
                        className={cn(
                          !formData.assigneeId && "text-muted-foreground",
                        )}
                      >
                        {formData.assigneeId
                          ? users.find((u) => u.id === formData.assigneeId)
                              ?.name ||
                            users.find((u) => u.id === formData.assigneeId)
                              ?.username ||
                            "담당자 선택"
                          : "담당자 선택"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] min-w-48 p-0"
                    align="start"
                  >
                    <div className="border-b px-3 py-1">
                      <Input
                        placeholder="이름 또는 학번 검색"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="h-6 border-0 p-0 shadow-none focus-visible:ring-0"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {users
                        .filter((u) => {
                          const q = assigneeSearch.toLowerCase();
                          return (
                            !q ||
                            u.name?.toLowerCase().includes(q) ||
                            u.username?.toLowerCase().includes(q) ||
                            u.studentId?.toLowerCase().includes(q)
                          );
                        })
                        .map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              handleInputChange("assigneeId", user.id);
                              setAssigneeOpen(false);
                              setAssigneeSearch("");
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted",
                              formData.assigneeId === user.id && "bg-muted",
                            )}
                          >
                            <Check
                              className={cn(
                                "h-3 w-3 shrink-0",
                                formData.assigneeId === user.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span>{user.name || user.username}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {user.studentId}
                            </span>
                          </button>
                        ))}
                      {users.filter((u) => {
                        const q = assigneeSearch.toLowerCase();
                        return (
                          !q ||
                          u.name?.toLowerCase().includes(q) ||
                          u.username?.toLowerCase().includes(q) ||
                          u.studentId?.toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                        <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                          검색 결과가 없습니다
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                {isProject ? (
                  <p className="text-sm">
                    {modeFields.status === "OPEN"
                      ? "모집중 — 진행 방식에 따라 자동으로 설정됩니다."
                      : "생성됨 — 진행 방식에 따라 자동으로 설정됩니다."}
                  </p>
                ) : (
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger id="status" className="w-48">
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* 일정 Card */}
        <Card>
          <CardHeader>
            <CardTitle>일정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>
                  시작일 <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs",
                        !formData.startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate
                        ? format(parseISO(formData.startDate), "PPP", {
                            locale: ko,
                          })
                        : "시작일 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.startDate
                          ? parseISO(formData.startDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        handleInputChange(
                          "startDate",
                          date ? format(date, "yyyy-MM-dd") : "",
                        )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>
                  종료일 <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs",
                        !formData.endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate
                        ? format(parseISO(formData.endDate), "PPP", {
                            locale: ko,
                          })
                        : "종료일 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.endDate
                          ? parseISO(formData.endDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        handleInputChange(
                          "endDate",
                          date ? format(date, "yyyy-MM-dd") : "",
                        )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              종료일은 시작일 이후여야 합니다.
            </p>
          </CardContent>
        </Card>

        {/* 참여자 Card */}
        {allowsInitialMembers && (
          <ParticipantsCard
            allUsers={users}
            newUserIds={newParticipantIds}
            onToggleNew={(uid) =>
              setNewParticipantIds((prev) =>
                prev.includes(uid)
                  ? prev.filter((id) => id !== uid)
                  : [...prev, uid],
              )
            }
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/manage/activities")}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            size="lg"
          >
            {saving ? "생성 중..." : "생성"}
          </Button>
        </div>
      </div>
    </div>
  );
}
