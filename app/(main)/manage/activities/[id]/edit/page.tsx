"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, X as XIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setError(null);

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
      setError("활동 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(
    field: keyof typeof formData,
    value: string | number,
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setError(null);
    setSuccessMessage(null);
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
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

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
      setSuccessMessage("활동이 성공적으로 수정되었습니다.");
      setIsDirty(false);

      // Redirect after a brief delay
      setTimeout(() => {
        router.push(`/manage/activities`);
      }, 1000);
    } catch (err) {
      console.error("Failed to update activity:", err);
      setError("활동 수정에 실패했습니다. 다시 시도해주세요.");
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
      <div className="space-y-3 border-b pb-6">
        <Button
          onClick={() => router.push("/manage/activities")}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>

        <h1 className="text-2xl font-bold tracking-tight">활동 정보 수정</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          활동의 기본 정보와 일정을 수정할 수 있습니다.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700 mb-5">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-5">
          {error}
        </div>
      )}

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
                    value={formData.activityTypeId.toString()}
                    onValueChange={(value) =>
                      handleInputChange("activityTypeId", parseInt(value))
                    }
                  >
                    <SelectTrigger id="activityType">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
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
                    value={formData.quarterId.toString()}
                    onValueChange={(value) =>
                      handleInputChange("quarterId", parseInt(value))
                    }
                  >
                    <SelectTrigger id="quarter">
                      <SelectValue placeholder="분기 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarters.map((quarter) => (
                        <SelectItem
                          key={quarter.id}
                          value={quarter.id.toString()}
                        >
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
                    <SelectTrigger id="status">
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
                  <Label htmlFor="assignee">담당자</Label>
                  <Select
                    value={formData.assigneeId.toString()}
                    onValueChange={(value) =>
                      handleInputChange("assigneeId", parseInt(value))
                    }
                  >
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="담당자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name || user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="startDate">
                    시작일 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    종료일 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                종료일은 시작일 이후여야 합니다.
              </p>
            </CardContent>
          </Card>

          {/* 메타 정보 Card (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle>메타 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">생성 일시</p>
                  <p className="font-medium">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">수정 일시</p>
                  <p className="font-medium">
                    {formatDateTime(activity.modifiedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">생성자</p>
                  <p className="font-medium">{activity.createdBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">수정자</p>
                  <p className="font-medium">{activity.modifiedBy}</p>
                </div>
              </div>
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
