"use client";

import { DatePicker } from "@/components/ui/date-picker";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronsUpDown, Check, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getActivityById, updateActivity } from "@/lib/api/activity";
import { getLectureMaterialsByActivity } from "@/lib/api/lecture-material";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getAllQuarters } from "@/lib/api/quarter";
import { getAllUsers } from "@/lib/api/user";
import {
  getActivityParticipantsByActivityId,
  createActivityParticipant,
  deleteActivityParticipant,
} from "@/lib/api/activity-participant";
import {
  ActivityResponse,
  ActivityRequest,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { ParticipantsCard } from "@/components/custom/activity/participants-card";
import {
  PROJECT_MODE_OPTIONS,
  ProjectMode,
  deriveProjectMode,
  projectModeFields,
} from "@/lib/constants/project-mode";
import { isDiscordUrl, supportsDiscordLink } from "@/lib/constants/discord-link";
import { operationPlanLabel } from "@/lib/constants/operation-plan";
import {
  activityMaterialHelpText,
  activityMaterialLabel,
  activityMaterialPlaceholder,
} from "@/lib/constants/activity-material";
import { resolveActivityReturnSource } from "@/lib/constants/activity-navigation";
import { isMaterialUrl } from "@/lib/utils/material-url";
import { useAuth } from "@/lib/contexts/AuthContext";

// ========================
// HELPER FUNCTIONS
// ========================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function toDateInputValue(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const STATUS_OPTIONS = [
  { value: "CREATED", label: "준비 중" },
  { value: "OPEN", label: "모집 중" },
  { value: "ONGOING", label: "진행 중" },
  { value: "COMPLETED", label: "종료" },
];

// ========================
// MAIN COMPONENT
// ========================

interface ActivityEditScreenProps {
  viewMode: "admin" | "assignee";
}

export function ActivityEditScreen({ viewMode }: ActivityEditScreenProps) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = params.id as string;
  const from = searchParams.get("from");
  const returnSource = resolveActivityReturnSource(from);
  const detailReturnSource = resolveActivityReturnSource(
    searchParams.get("detailFrom"),
  );
  const returnQuery =
    from === "activity-detail"
      ? `?from=activity-detail&detailFrom=${detailReturnSource ?? "activities"}`
      : returnSource
        ? `?from=${returnSource}`
        : "";
  const { userId, hasRole, isLoading: authLoading } = useAuth();
  const hasAdminRole = hasRole("MANAGER");
  const canEditOperations = hasAdminRole;
  const canEditDeposit = canEditOperations;
  const managementPath =
    viewMode === "assignee"
      ? `/home/activities/${activityId}/manage${returnQuery}`
      : `/manage/activities/${activityId}${returnQuery}`;

  // Data state
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingParticipants, setExistingParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [removedParticipantIds, setRemovedParticipantIds] = useState<string[]>(
    [],
  );
  const [newParticipantIds, setNewParticipantIds] = useState<string[]>([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
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
    selectedActivityType?.code === "SPECIAL_LECTURE" ||
    selectedActivityType?.code === "LECTURE";
  const isProject = selectedActivityType?.code === "PROJECT";
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
      // 이미 진행/완료된 활동의 상태는 진행 방식 변경으로 되돌리지 않는다.
      status:
        prev.status === "CREATED" || prev.status === "OPEN"
          ? fields.status
          : prev.status,
      participantLimit: fields.allowsParticipantLimit
        ? prev.participantLimit
        : "",
      recruitmentPositions:
        mode === "RECRUITING" ? prev.recruitmentPositions : "",
      recruitmentStartDate:
        mode === "RECRUITING" ? prev.recruitmentStartDate : "",
      recruitmentEndDate:
        mode === "RECRUITING" ? prev.recruitmentEndDate : "",
    }));
  }

  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [activityId, authLoading, canEditOperations]);

  async function loadData() {
    try {
      setLoading(true);

      const activityData = await getActivityById(activityId);
      const isAssignee = activityData.assignee.id === userId;
      const hasPageAccess = isAssignee || hasAdminRole;
      if (!hasPageAccess) {
        toast.error("해당 활동을 수정할 권한이 없습니다.");
        router.replace(
          isAssignee
            ? `/home/activities/${activityId}/edit${returnQuery}`
            : `/activities/${activityId}`,
        );
        return;
      }

      const [
        typesData,
        quartersData,
        usersData,
        participantsData,
        materialsData,
      ] = await Promise.all([
        getAllActivityTypes(),
        getAllQuarters(),
        canEditOperations ? getAllUsers() : Promise.resolve([]),
        getActivityParticipantsByActivityId({ activityId }),
        getLectureMaterialsByActivity(activityId),
      ]);

      setActivity(activityData);
      setActivityTypes(typesData);
      setQuarters(quartersData);
      setUsers(usersData);
      setExistingParticipants(participantsData);

      // Initialize form with activity data
      setFormData({
        title: activityData.title,
        description: activityData.description,
        status: activityData.status,
        activityTypeId: activityData.activityType.id,
        assigneeId: activityData.assignee.id,
        quarterId: activityData.quarter.id,
        startDate: toDateInputValue(activityData.startDate),
        endDate: toDateInputValue(activityData.endDate),
        depositAmount: String(activityData.depositAmount ?? 30000),
        participantLimit: String(activityData.participantLimit ?? ""),
        recruitmentPositions: activityData.recruitmentPositions ?? "",
        discordUrl: activityData.discordUrl ?? "",
        recruitmentStartDate: activityData.recruitmentStartDate ?? "",
        recruitmentEndDate: activityData.recruitmentEndDate ?? "",
        operationPlan: activityData.operationPlan ?? "",
        instructorCareer: activityData.instructorCareer ?? "",
        materialUrl:
          materialsData.find((material) => material.primary)?.driveUrl ?? "",
      });
      setProjectMode(deriveProjectMode(activityData));
    } catch (err) {
      console.error("Failed to load activity:", err);
      toast.error("활동 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }

  function validateForm(): string | null {
    if (!formData.title.trim()) {
      return "활동명을 입력해주세요.";
    }

    if (!formData.startDate || !formData.endDate) {
      return "시작일과 종료일을 입력해주세요.";
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      return "종료일은 시작일 이후여야 합니다.";
    }

    if (!formData.activityTypeId) {
      return "활동 유형을 선택해주세요.";
    }

    if (!formData.quarterId) {
      return "분기를 선택해주세요.";
    }

    const depositAmount = Number(formData.depositAmount);
    if (
      canEditDeposit &&
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
      canEditOperations &&
      formData.participantLimit &&
      (!Number.isInteger(participantLimit) ||
        participantLimit < 1 ||
        participantLimit > 1000)
    ) {
      return "추가 참여 정원은 1명 이상 1,000명 이하로 입력해주세요.";
    }
    const currentParticipantCount = existingParticipants.filter(
      (participant) =>
        participant.status !== "REJECTED" &&
        participant.user.id !== formData.assigneeId,
    ).length;
    const newParticipantCount = newParticipantIds.filter(
      (userId) => userId !== formData.assigneeId,
    ).length;
    if (
      canEditOperations &&
      formData.participantLimit &&
      participantLimit < currentParticipantCount + newParticipantCount
    ) {
      return "추가 참여 정원은 현재 신청·참여 인원보다 적을 수 없습니다.";
    }
    if (
      canEditOperations &&
      Boolean(formData.recruitmentStartDate) !==
      Boolean(formData.recruitmentEndDate)
    ) {
      return "모집 시작일과 종료일을 모두 입력해주세요.";
    }
    if (
      canEditOperations &&
      formData.recruitmentStartDate &&
      formData.recruitmentEndDate &&
      formData.recruitmentEndDate < formData.recruitmentStartDate
    ) {
      return "모집 종료일은 모집 시작일보다 빠를 수 없습니다.";
    }
    if (
      canEditOperations &&
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
      return `${materialLabel} 링크를 확인해주세요.`;
    }

    return null;
  }

  async function handleSave() {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);

      const updateData: ActivityRequest = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        activityTypeId: formData.activityTypeId,
        assigneeId: formData.assigneeId || undefined,
        quarterId: formData.quarterId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        depositAmount:
          canEditDeposit && requiresDeposit
            ? Number(formData.depositAmount)
            : undefined,
        participantLimit: formData.participantLimit
          ? Number(formData.participantLimit)
          : undefined,
        listed: isProject ? modeFields.listed : undefined,
        recruitmentPositions:
          isProject && projectMode === "RECRUITING"
            ? formData.recruitmentPositions.trim() || null
            : null,
        discordUrl: allowsDiscordLink
          ? formData.discordUrl.trim() || null
          : null,
        recruitmentStartDate: formData.recruitmentStartDate || null,
        recruitmentEndDate: formData.recruitmentEndDate || null,
        operationPlan: planLabel
          ? formData.operationPlan.trim() || null
          : null,
        instructorCareer: isSpecialLecture
          ? formData.instructorCareer.trim() || null
          : null,
        materialUrl: materialLabel
          ? formData.materialUrl.trim() || null
          : null,
      };

      await updateActivity(activityId, updateData);

      
      const participantIdsToRemove = removedParticipantIds;
      const participantUserIdsToAdd = allowsInitialMembers
        ? newParticipantIds
        : [];

      await Promise.all([
        ...participantIdsToRemove.map((pid) => deleteActivityParticipant(pid)),
        ...participantUserIdsToAdd.map((userId) =>
          createActivityParticipant({ activityId, userId, status: "APPROVED" }),
        ),
      ]);

      toast.success("활동이 수정되었습니다.");
      setIsDirty(false);
      router.push(managementPath);
    } catch (err) {
      console.error("Failed to update activity:", err);
      toast.error("활동 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      router.push(managementPath);
    }
  }

  function confirmCancel() {
    setShowCancelDialog(false);
    router.push(managementPath);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">활동 수정하기</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          활동 기본 정보를 수정합니다
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form Content */}
      {!loading && activity && (
        <div className="space-y-5">
          {/* 기본 정보 Card */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canEditOperations && (
                <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  활동명과 설명은 수정할 수 있습니다. 활동 유형, 프로젝트 진행 방식,
                  담당자, 일정, 모집 조건과 상태 변경은 운영진에게 요청해주세요.
                </p>
              )}
              {/* Activity Type */}
              <div className="space-y-2">
                <Label htmlFor="activityType">
                  유형 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.activityTypeId}
                  disabled={!canEditOperations}
                  onValueChange={(value) => {
                    handleInputChange("activityTypeId", value);
                    const type = activityTypes.find(
                      (item) => item.id === value,
                    );
                    if (
                      (type?.code === "STUDY" ||
                        type?.code === "SPECIAL_LECTURE" ||
                        type?.code === "LECTURE") &&
                      !formData.depositAmount
                    ) {
                      handleInputChange("depositAmount", "30000");
                    }
                    if (
                      type?.code === "LECTURE" &&
                      !formData.participantLimit
                    ) {
                      handleInputChange("participantLimit", "5");
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
                {isProject && (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm font-medium">프로젝트 진행 방식</p>
                    {canEditOperations ? (
                      <>
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
                      </>
                    ) : (
                      <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">
                            {
                              PROJECT_MODE_OPTIONS.find(
                                (option) => option.mode === projectMode,
                              )?.label
                            }
                          </p>
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                            <LockKeyhole className="h-3.5 w-3.5" />
                            변경 희망시 운영진에게 문의해주세요.
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {
                            PROJECT_MODE_OPTIONS.find(
                              (option) => option.mode === projectMode,
                            )?.description
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isProject && projectMode === "RECRUITING" && (
                  <div className="space-y-2">
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
                      placeholder="예: 프론트엔드 1명 (React), 백엔드 1명 (Spring)"
                      rows={2}
                      maxLength={500}
                      disabled={!canEditOperations}
                    />
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
                      id="operationPlan"
                      maxLength={10000}
                      value={formData.operationPlan}
                      onChange={(event) =>
                        handleInputChange("operationPlan", event.target.value)
                      }
                      placeholder="열람 가능한 구글 드라이브/노션 링크를 첨부해 주세요."
                      autoComplete="off"
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
                      placeholder={activityMaterialPlaceholder(
                        selectedActivityType?.code,
                      )}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      {activityMaterialHelpText()} 비워
                      두고 저장하면 기존 링크가 제거됩니다.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>모집 기간 (선택)</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <DatePicker
                      clearable
                      disabled={!canEditOperations}
                      className="w-44"
                      value={formData.recruitmentStartDate}
                      onChange={(value) =>
                        handleInputChange(
                          "recruitmentStartDate",
                          value,
                        )
                      }
                    />
                    <span className="text-sm text-muted-foreground">~</span>
                    <DatePicker
                      clearable
                      disabled={!canEditOperations}
                      className="w-44"
                      value={formData.recruitmentEndDate}
                      onChange={(value) =>
                        handleInputChange(
                          "recruitmentEndDate",
                          value,
                        )
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    이 기간에만 참여 신청을 받습니다. 비워두면 모집을 진행하지
                    않습니다.
                  </p>
                </div>

                {canEditDeposit && requiresDeposit && (
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

                {allowsDiscordLink && (
                  <div className="space-y-2">
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
                  </div>
                )}

                {isProject && !showsParticipantLimit && (
                  <div className="space-y-2">
                    <Label>추가 참여 정원</Label>
                    <p className="text-sm">
                      {projectMode === "PERSONAL"
                        ? "담당자 혼자 진행하므로 추가 참여 정원을 설정하지 않습니다."
                        : "현재 참여자로 확정되며, 추가 신청은 받지 않습니다."}
                    </p>
                  </div>
                )}

                <div className={showsParticipantLimit ? "space-y-2" : "hidden"}>
                  <Label htmlFor="participantLimit">추가 참여 정원</Label>
                  <div className="relative w-48">
                    <Input
                      id="participantLimit"
                      disabled={!canEditOperations}
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
                      ? "인강 활동은 기본 추가 참여 정원이 5명입니다. "
                      : "비워두면 제한이 없습니다. "}
                    담당자를 제외하고 추가로 신청받을 수 있는 인원입니다.
                  </p>
                </div>

                {/* Quarter */}
                <div className="space-y-2">
                  <Label htmlFor="quarter">
                    분기 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.quarterId}
                    disabled={!canEditOperations}
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

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">상태</Label>
                  <Select
                    value={formData.status}
                    disabled={!canEditOperations}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
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
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <Label>
                    담당자 <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={!canEditOperations}
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
                              activity?.assignee?.name ||
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
                  <DatePicker
                    value={formData.startDate}
                    onChange={(value) => handleInputChange("startDate", value)}
                    placeholder="시작일 선택"
                    disabled={!canEditOperations}
                    clearable
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>
                    종료일 <span className="text-destructive">*</span>
                  </Label>
                  <DatePicker
                    value={formData.endDate}
                    onChange={(value) => handleInputChange("endDate", value)}
                    placeholder="종료일 선택"
                    disabled={!canEditOperations}
                    min={formData.startDate || undefined}
                    clearable
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                종료일은 시작일 이후여야 합니다.
              </p>
            </CardContent>
          </Card>

          {/* 참여자 Card */}
          {canEditOperations && allowsInitialMembers && (
            <ParticipantsCard
              allUsers={users}
              existingParticipants={existingParticipants}
              onRemoveExisting={(pid) => {
                setExistingParticipants((prev) =>
                  prev.filter((p) => p.id !== pid),
                );
                setRemovedParticipantIds((prev) => [...prev, pid]);
                setIsDirty(true);
              }}
              newUserIds={newParticipantIds}
              onToggleNew={(uid) => {
                setNewParticipantIds((prev) =>
                  prev.includes(uid)
                    ? prev.filter((id) => id !== uid)
                    : [...prev, uid],
                );
                setIsDirty(true);
              }}
            />
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
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
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>변경사항 취소</AlertDialogTitle>
            <AlertDialogDescription>
              저장하지 않은 변경사항이 있습니다.
              <br />
              정말로 취소하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 편집</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              변경사항 버리기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ActivityEditPage() {
  return <ActivityEditScreen viewMode="admin" />;
}
