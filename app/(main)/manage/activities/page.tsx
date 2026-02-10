"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Filter,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { searchActivities, deleteActivity } from "@/lib/api/activity";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getAllQuarters } from "@/lib/api/quarter";
import {
  ActivityResponse,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    CREATED: "준비 중",
    RECRUITING: "모집 중",
    OPEN: "모집 중",
    IN_PROGRESS: "진행 중",
    ONGOING: "진행 중",
    COMPLETED: "종료",
  };
  return statusMap[status] || status;
}

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "RECRUITING":
    case "OPEN":
      return "default";
    case "IN_PROGRESS":
    case "ONGOING":
      return "outline";
    case "COMPLETED":
      return "secondary";
    case "CREATED":
      return "outline";
    default:
      return "outline";
  }
}

// ========================
// MAIN COMPONENT
// ========================

export default function ActivitiesManagementPage() {
  const router = useRouter();

  // Data state
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("ALL");
  const [quarterFilter, setQuarterFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);
      const [activitiesData, typesData, quartersData] = await Promise.all([
        searchActivities({}),
        getAllActivityTypes(),
        getAllQuarters(),
      ]);
      setActivities(activitiesData);
      setActivityTypes(typesData);
      setQuarters(quartersData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    try {
      setLoading(true);
      setError(null);

      const params: {
        title?: string;
        status?: string;
        activityTypeId?: string;
        quarterId?: string;
      } = {};

      if (searchInput.trim()) params.title = searchInput.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (activityTypeFilter !== "ALL")
        params.activityTypeId = activityTypeFilter;
      if (quarterFilter !== "ALL") params.quarterId = quarterFilter;

      const results = await searchActivities(params);
      setActivities(results);
    } catch (err) {
      console.error("Search failed:", err);
      setError("검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setActivityTypeFilter("ALL");
    setQuarterFilter("ALL");
    setStatusFilter("ALL");
    setSearchInput("");
    loadInitialData();
  }

  function handleActivityClick(activityId: number) {
    router.push(`/manage/activities/${activityId}`);
  }

  function handleEditClick(activityId: number, e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/manage/activities/${activityId}/edit`);
  }

  function handleDeleteClick(activity: ActivityResponse, e: React.MouseEvent) {
    e.stopPropagation();
    setActivityToDelete({ id: activity.id, title: activity.title });
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!activityToDelete) return;

    try {
      await deleteActivity(activityToDelete.id);
      setActivities(activities.filter((a) => a.id !== activityToDelete.id));
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("삭제에 실패했습니다.");
    }
  }

  const hasFilters =
    activityTypeFilter !== "ALL" ||
    quarterFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    searchInput.trim() !== "";

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">활동 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            학회 활동을 조회하고 관리합니다
          </p>
        </div>
        <Button onClick={() => router.push("/activities/new")}>
          <Plus className="h-4 w-4 mr-2" />
          활동 생성
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-5">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-5">
        <div className="bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
            {/* Activity Type Filter */}
            <Select
              value={activityTypeFilter}
              onValueChange={setActivityTypeFilter}
            >
              <SelectTrigger className="w-32 h-9 bg-white">
                <SelectValue placeholder="전체 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 유형</SelectItem>
                {activityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quarter Filter */}
            <Select value={quarterFilter} onValueChange={setQuarterFilter}>
              <SelectTrigger className="w-40 h-9 bg-white">
                <SelectValue placeholder="전체 분기" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 분기</SelectItem>
                {quarters.map((quarter) => (
                  <SelectItem key={quarter.id} value={quarter.id.toString()}>
                    {quarter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9 bg-white">
                <SelectValue placeholder="전체 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 상태</SelectItem>
                <SelectItem value="CREATED">준비 중</SelectItem>
                <SelectItem value="OPEN">모집 중</SelectItem>
                <SelectItem value="ONGOING">진행 중</SelectItem>
                <SelectItem value="COMPLETED">종료</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Input */}
            <div className="flex-1 min-w-40">
              <Input
                placeholder="활동명 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9 bg-white"
              />
            </div>

            {/* Clear Button */}
            {hasFilters && (
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="h-9"
              >
                <X className="h-4 w-4 mr-1" />
                초기화
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State - No activities */}
      {!loading && activities.length === 0 && !hasFilters && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  등록된 활동이 없습니다
                </h3>
                <p className="text-sm text-muted-foreground">
                  활동을 생성하면 이곳에 표시됩니다
                </p>
              </div>
              <Button onClick={() => router.push("/activities/new")}>
                <Plus className="h-4 w-4 mr-2" />첫 활동 만들기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No filtered results */}
      {!loading && activities.length === 0 && hasFilters && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  조건에 맞는 활동이 없습니다
                </h3>
                <p className="text-sm text-muted-foreground">
                  다른 필터를 시도해보세요
                </p>
              </div>
              <Button variant="outline" onClick={handleReset}>
                필터 초기화
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activities Table */}
      {!loading && activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>활동 목록</span>
              <span className="text-sm font-normal text-muted-foreground">
                총 {activities.length}개
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">활동명</TableHead>
                  <TableHead className="text-center w-[12%]">유형</TableHead>
                  <TableHead className="w-[12%]">분기</TableHead>
                  <TableHead className="w-[20%]">활동 기간</TableHead>
                  <TableHead className="text-center w-[12%]">상태</TableHead>
                  <TableHead className="w-[10%]">담당자</TableHead>
                  <TableHead className="text-center w-[10%]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleActivityClick(activity.id)}
                  >
                    <TableCell className="font-semibold">
                      {activity.title}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {activity.activityType.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.quarter.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(activity.startDate)} ~{" "}
                      {formatDate(activity.endDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(activity.status)}>
                        {getStatusLabel(activity.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.assignee.name || activity.assignee.username}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/manage/activities/${activity.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            상세
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/manage/activities/${activity.id}/edit`,
                              )
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>활동 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{activityToDelete?.title}</strong> 활동을
              삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
