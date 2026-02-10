"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActivityById, deleteActivity } from "@/lib/api/activity";
import {
  getActivityParticipantsByActivityId,
  updateActivityParticipantStatus,
} from "@/lib/api/activity-participant";
import { ActivityResponse } from "@/lib/interfaces/activity";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";

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

function getActivityStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    CREATED: "준비 중",
    OPEN: "모집 중",
    RECRUITING: "모집 중",
    ONGOING: "진행 중",
    IN_PROGRESS: "진행 중",
    COMPLETED: "종료",
  };
  return statusMap[status] || status;
}

function getActivityStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "OPEN":
    case "RECRUITING":
      return "default";
    case "ONGOING":
    case "IN_PROGRESS":
      return "secondary";
    case "COMPLETED":
      return "outline";
    default:
      return "outline";
  }
}

function getParticipantStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    APPLIED: "신청",
    APPROVED: "승인",
    REJECTED: "미승인",
  };
  return statusMap[status] || status;
}

function getParticipantStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "APPLIED":
      return "secondary";
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "CANCELED":
      return "outline";
    default:
      return "outline";
  }
}

// ========================
// LOADING SKELETON
// ========================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <Separator />

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ========================
// MAIN COMPONENT
// ========================

export default function ActivityDetailManagePage() {
  const params = useParams();
  const router = useRouter();
  const activityId = Number(params.id);

  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [participants, setParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [filteredParticipants, setFilteredParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  // Bulk update states
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [activityData, participantsData] = await Promise.all([
          getActivityById(activityId),
          getActivityParticipantsByActivityId({ activityId }),
        ]);

        setActivity(activityData);
        setParticipants(participantsData);
        setFilteredParticipants(participantsData);
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activityId]);

  // Apply filters whenever filter states or participants change
  useEffect(() => {
    let filtered = [...participants];

    // Status filter
    if (statusFilter !== "전체") {
      filtered = filtered.filter((p) => {
        const label = getParticipantStatusLabel(p.status);
        return label === statusFilter;
      });
    }

    // Search filter (name or student ID)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const name = p.user?.name?.toLowerCase() || "";
        const studentId = p.user?.studentId?.toLowerCase() || "";
        return name.includes(query) || studentId.includes(query);
      });
    }

    setFilteredParticipants(filtered);
  }, [participants, statusFilter, searchQuery]);

  function handleEdit() {
    router.push(`/manage/activities/${activityId}/edit`);
  }

  async function handleDelete() {
    if (deleting) return;

    setDeleting(true);
    try {
      await deleteActivity(activityId);
      router.push("/manage/activities");
    } catch (error) {
      console.error("Failed to delete activity:", error);
      alert("활동 삭제에 실패했습니다.");
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  function handleBackToList() {
    router.push("/manage/activities");
  }

  function handleMemberClick(userId: number, e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/manage/members/${userId}`);
  }

  // Selection handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      const allIds = new Set(filteredParticipants.map((p) => p.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSelectOne(id: number, checked: boolean) {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  }

  // Per-row status update
  async function handleStatusChange(participantId: number, newStatus: string) {
    if (updatingIds.has(participantId)) return;

    setUpdatingIds((prev) => new Set(prev).add(participantId));

    try {
      await updateActivityParticipantStatus(participantId, {
        activityId,
        status: newStatus as "APPLIED" | "APPROVED" | "REJECTED",
      });

      // Update local state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, status: newStatus as any } : p,
        ),
      );

      alert("상태가 변경되었습니다.");
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(participantId);
        return next;
      });
    }
  }

  // Bulk status update
  function handleBulkUpdateClick() {
    if (selectedIds.size === 0 || !bulkStatus) return;
    setShowBulkDialog(true);
  }

  async function handleBulkUpdateConfirm() {
    if (selectedIds.size === 0 || !bulkStatus) return;

    setBulkUpdating(true);
    const selectedArray = Array.from(selectedIds);

    // Run with limited concurrency
    const results = await runWithConcurrency(
      selectedArray,
      5,
      async (participantId) => {
        await updateActivityParticipantStatus(participantId, {
          activityId,
          status: bulkStatus as "APPLIED" | "APPROVED" | "REJECTED",
        });
        return participantId;
      },
    );

    // Count successes and failures
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    // Refresh data
    try {
      const updatedParticipants = await getActivityParticipantsByActivityId({
        activityId,
      });
      setParticipants(updatedParticipants);
    } catch (error) {
      console.error("Failed to refresh participants:", error);
    }

    // Show result
    if (failureCount === 0) {
      alert(`${successCount}건 변경 완료`);
    } else {
      alert(`${successCount}건 변경 완료, ${failureCount}건 실패`);
    }

    // Reset states
    setSelectedIds(new Set());
    setBulkStatus("");
    setShowBulkDialog(false);
    setBulkUpdating(false);
  }

  // Helper: run promises with concurrency limit
  async function runWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
  ): Promise<PromiseSettledResult<R>[]> {
    const results: PromiseSettledResult<R>[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = fn(item).then(
        (value) => {
          results.push({ status: "fulfilled", value });
        },
        (reason) => {
          results.push({ status: "rejected", reason });
        },
      );

      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1,
        );
      }
    }

    await Promise.allSettled(executing);
    return results;
  }

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <p className="text-muted-foreground">활동을 찾을 수 없습니다.</p>
        <Button onClick={handleBackToList} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Back button */}
      <Button
        onClick={handleBackToList}
        variant="ghost"
        size="sm"
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        목록으로
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl font-bold">{activity.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant={getActivityStatusVariant(activity.status)}>
              {getActivityStatusLabel(activity.status)}
            </Badge>
            <span>•</span>
            <span>{activity.activityType.name}</span>
            <span>•</span>
            <span>{activity.quarter.name}</span>
            <span>•</span>
            <span>
              {formatDate(activity.startDate)} ~ {formatDate(activity.endDate)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            수정
          </Button>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="participants">신청 내역</TabsTrigger>
        </TabsList>

        {/* Tab 1: 기본 정보 */}
        <TabsContent value="info" className="space-y-4">
          {/* Activity Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>활동 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
                <div className="text-sm font-medium text-muted-foreground">
                  활동명
                </div>
                <div className="text-sm">{activity.title}</div>

                <div className="text-sm font-medium text-muted-foreground">
                  설명
                </div>
                <div className="text-sm">
                  {activity.description || "설명 없음"}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  유형
                </div>
                <div className="text-sm">{activity.activityType.name}</div>

                <div className="text-sm font-medium text-muted-foreground">
                  상태
                </div>
                <div>
                  <Badge variant={getActivityStatusVariant(activity.status)}>
                    {getActivityStatusLabel(activity.status)}
                  </Badge>
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  분기
                </div>
                <div className="text-sm">{activity.quarter.name}</div>

                <div className="text-sm font-medium text-muted-foreground">
                  기간
                </div>
                <div className="text-sm">
                  {formatDate(activity.startDate)} ~{" "}
                  {formatDate(activity.endDate)}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  담당자
                </div>
                <div className="text-sm">
                  {activity.assignee?.name || "미지정"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>메타 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
                <div className="text-sm font-medium text-muted-foreground">
                  생성일
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(activity.createdAt)}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  수정일
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(activity.modifiedAt)}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  생성자
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.createdBy || "알 수 없음"}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  수정자
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.modifiedBy || "알 수 없음"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 신청 내역 */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>신청 내역</CardTitle>
                <span className="text-sm text-muted-foreground">
                  총 {filteredParticipants.length}건
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-35 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="신청">신청</SelectItem>
                    <SelectItem value="승인">승인</SelectItem>
                    <SelectItem value="미승인">미승인</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="이름 또는 학번 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs bg-white"
                />

                {(statusFilter !== "전체" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("전체");
                      setSearchQuery("");
                    }}
                  >
                    필터 초기화
                  </Button>
                )}
              </div>

              {/* Table */}
              {filteredParticipants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserIcon className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">신청 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredParticipants.length > 0 &&
                              selectedIds.size === filteredParticipants.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-30">이름</TableHead>
                        <TableHead className="w-30">학번</TableHead>
                        <TableHead className="w-60">이메일</TableHead>
                        <TableHead className="w-25 text-center">
                          신청 상태
                        </TableHead>
                        <TableHead className="w-30 text-right">
                          신청일
                        </TableHead>
                        <TableHead className="w-40 text-center">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.map((participant) => {
                        const isUpdating = updatingIds.has(participant.id);
                        return (
                          <TableRow key={participant.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(participant.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectOne(
                                    participant.id,
                                    checked as boolean,
                                  )
                                }
                                disabled={isUpdating}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {participant.user?.name || "-"}
                            </TableCell>
                            <TableCell>
                              {participant.user?.studentId || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {participant.user?.email || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={getParticipantStatusVariant(
                                  participant.status,
                                )}
                              >
                                {getParticipantStatusLabel(participant.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {formatDate(participant.createdAt)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Select
                                  value={participant.status}
                                  onValueChange={(value) =>
                                    handleStatusChange(participant.id, value)
                                  }
                                  disabled={isUpdating}
                                >
                                  <SelectTrigger className="h-8 w-24 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="APPLIED">
                                      신청
                                    </SelectItem>
                                    <SelectItem value="APPROVED">
                                      승인
                                    </SelectItem>
                                    <SelectItem value="REJECTED">
                                      미승인
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {participant.user && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) =>
                                      handleMemberClick(participant.user!.id, e)
                                    }
                                    className="h-8 px-2 text-xs"
                                  >
                                    상세
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Bulk update toolbar */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="px-3 py-2 border border-dashed border-gray-300 rounded-md">
                    <span className="text-sm font-medium">
                      선택 {selectedIds.size}건
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={bulkStatus} onValueChange={setBulkStatus}>
                      <SelectTrigger className="w-32 bg-white">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVED">승인</SelectItem>
                        <SelectItem value="REJECTED">미승인</SelectItem>
                        <SelectItem value="APPLIED">신청</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleBulkUpdateClick}
                      disabled={!bulkStatus || bulkUpdating}
                    >
                      일괄 적용
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Update Confirmation Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상태를 일괄 변경할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedIds.size}건의 신청 상태가 변경됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkUpdating}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkUpdateConfirm}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? "변경 중..." : "변경"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>활동 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 활동을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
