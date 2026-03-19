"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
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
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getAllQuarters } from "@/lib/api/quarter";
import { getAllUsers } from "@/lib/api/user";
import {
  ActivityResponse,
  ActivityRequest,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { UserResponseDto } from "@/lib/interfaces/auth";

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

export default function ActivityEditPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  // Data state
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  });

  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [activityId]);

  async function loadData() {
    try {
      setLoading(true);

      const [activityData, typesData, quartersData, usersData] =
        await Promise.all([
          getActivityById(activityId),
          getAllActivityTypes(),
          getAllQuarters(),
          getAllUsers(),
        ]);

      setActivity(activityData);
      setActivityTypes(typesData);
      setQuarters(quartersData);
      setUsers(usersData);

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
      });
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
      };

      await updateActivity(activityId, updateData);
      toast.success("활동이 수정되었습니다.");
      setIsDirty(false);
      router.push(`/manage/activities`);
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
      router.push("/manage/activities");
    }
  }

  function confirmCancel() {
    setShowCancelDialog(false);
    router.push("/manage/activities");
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
                {/* Activity Type */}
                <div className="space-y-2">
                  <Label htmlFor="activityType">
                    유형 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.activityTypeId}
                    onValueChange={(value) =>
                      handleInputChange("activityTypeId", value)
                    }
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

                {/* Quarter */}
                <div className="space-y-2">
                  <Label htmlFor="quarter">
                    분기 <span className="text-destructive">*</span>
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

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">상태</Label>
                  <Select
                    value={formData.status}
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
