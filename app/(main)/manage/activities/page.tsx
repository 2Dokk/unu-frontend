"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Pencil,
  Trash2,
  MoreVertical,
  Eye,
  SquarePlus,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/custom/common/delete-confirm-dialog";
import {
  searchActivities,
  deleteActivity,
  updateActivityStatus,
} from "@/lib/api/activity";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getAllQuarters } from "@/lib/api/quarter";
import {
  ActivityResponse,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { ActivityStatusBadge } from "@/components/custom/activity/activity-status-badge";
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";
import { formatDate } from "@/lib/utils/date-utils";

const STATUS_OPTIONS = [
  { value: "CREATED", label: "준비 중" },
  { value: "OPEN", label: "모집 중" },
  { value: "ONGOING", label: "진행 중" },
  { value: "COMPLETED", label: "종료" },
];

export default function ActivitiesManagementPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("ALL");
  const [quarterFilter, setQuarterFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string>("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [activityTypeFilter, quarterFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    try {
      setLoading(true);
      const [activitiesData, typesData, quartersData] = await Promise.all([
        searchActivities({}),
        getAllActivityTypes(),
        getAllQuarters(),
      ]);
      setActivities(activitiesData);
      setActivityTypes(typesData);
      setQuarters(quartersData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    try {
      setLoading(true);
      const params: {
        title?: string;
        status?: string;
        activityTypeId?: string;
        quarterId?: string;
      } = {};
      if (search.trim()) params.title = search.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (activityTypeFilter !== "ALL")
        params.activityTypeId = activityTypeFilter;
      if (quarterFilter !== "ALL") params.quarterId = quarterFilter;
      const results = await searchActivities(params);
      setActivities(results);
    } catch (error: any) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }

  // Bulk selection helpers
  const selectedActivities = activities.filter((a) => selectedIds.has(a.id));
  const allSelected =
    activities.length > 0 && activities.every((a) => selectedIds.has(a.id));

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(activities.map((a) => a.id)) : new Set());
  }

  function handleSelectOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function openBulkStatusDialog(targetStatus: string) {
    setBulkTargetStatus(targetStatus);
    setBulkStatusDialogOpen(true);
  }

  async function handleBulkStatusChange() {
    setBulkUpdating(true);
    try {
      await Promise.all(
        selectedActivities.map((a) =>
          updateActivityStatus(a.id, bulkTargetStatus),
        ),
      );
      setActivities((prev) =>
        prev.map((a) =>
          selectedIds.has(a.id) ? { ...a, status: bulkTargetStatus } : a,
        ),
      );
      setSelectedIds(new Set());
    } catch (error: any) {
      console.error("Bulk status update failed:", error);
    } finally {
      setBulkUpdating(false);
      setBulkStatusDialogOpen(false);
    }
  }

  function confirmDelete(id: string, title: string) {
    setItemToDelete({ id, title });
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!itemToDelete) return;
    try {
      await deleteActivity(itemToDelete.id);
      setActivities((prev) => prev.filter((a) => a.id !== itemToDelete.id));
    } catch (error: any) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }

  const hasFilters =
    activityTypeFilter !== "ALL" ||
    quarterFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    search.trim() !== "";

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">활동 관리</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          학회 활동을 관리합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          {/* Title + New Button */}
          <div className="flex items-center justify-between">
            <CardTitle>활동 목록</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/manage/activities/new")}
            >
              <Plus className="h-3 w-3" />
              <span className="text-xs">활동 생성</span>
            </Button>
          </div>

          {/* Filters / Bulk toolbar toggle */}
          <div className="mt-4">
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-3 h-9">
                <span className="text-xs text-muted-foreground font-medium">
                  {selectedIds.size}개 선택됨
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      상태 변경
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        className="text-xs"
                        onClick={() => openBulkStatusDialog(opt.value)}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 ml-auto"
                  onClick={() => setSelectedIds(new Set())}
                >
                  선택 해제
                </Button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="활동명 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={activityTypeFilter}
                  onValueChange={setActivityTypeFilter}
                >
                  <SelectTrigger className="w-full md:w-35 text-xs">
                    <SelectValue placeholder="전체 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                      전체 유형
                    </SelectItem>
                    {activityTypes.map((type) => (
                      <SelectItem
                        key={type.id}
                        value={type.id.toString()}
                        className="text-xs"
                      >
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                  <SelectTrigger className="w-full md:w-35 text-xs">
                    <SelectValue placeholder="전체 분기" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                      전체 분기
                    </SelectItem>
                    {quarters.map((quarter) => (
                      <SelectItem
                        key={quarter.id}
                        value={quarter.id.toString()}
                        className="text-xs"
                      >
                        {quarter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-35 text-xs">
                    <SelectValue placeholder="전체 상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                      전체 상태
                    </SelectItem>
                    <SelectItem value="CREATED" className="text-xs">
                      준비 중
                    </SelectItem>
                    <SelectItem value="OPEN" className="text-xs">
                      모집 중
                    </SelectItem>
                    <SelectItem value="ONGOING" className="text-xs">
                      진행 중
                    </SelectItem>
                    <SelectItem value="COMPLETED" className="text-xs">
                      종료
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {hasFilters
                ? "검색 결과가 없습니다"
                : "아직 등록된 활동이 없습니다"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          handleSelectAll(!!checked)
                        }
                      />
                    </TableHead>
                    <TableHead>활동명</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">
                      유형
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-center">
                      분기
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-center">
                      기간
                    </TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="hidden md:table-cell text-center">
                      담당자
                    </TableHead>
                    <TableHead className="w-16">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow
                      key={activity.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/manage/activities/${activity.id}`)
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(activity.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(activity.id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {activity.title}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <ActivityTypeBadge
                          activityType={activity.activityType}
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center text-muted-foreground text-sm">
                        {activity.quarter?.name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center text-muted-foreground text-sm">
                        {formatDate(activity.startDate)} -{" "}
                        {formatDate(activity.endDate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <ActivityStatusBadge status={activity.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center text-muted-foreground text-sm">
                        {activity.assignee.name || activity.assignee.username}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/manage/activities/${activity.id}/edit`,
                                );
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(activity.id, activity.title);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Status Change Dialog */}
      <AlertDialog
        open={bulkStatusDialogOpen}
        onOpenChange={setBulkStatusDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상태 일괄 변경</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 활동 <strong>{selectedIds.size}개</strong>를{" "}
              <strong>
                {
                  STATUS_OPTIONS.find((o) => o.value === bulkTargetStatus)
                    ?.label
                }
              </strong>
              (으)로 변경합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkUpdating}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusChange}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? "변경 중..." : "변경"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemValue={itemToDelete?.title || ""}
        onConfirm={handleDelete}
      />
    </div>
  );
}
