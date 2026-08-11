"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchActivities } from "@/lib/api/activity";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { getCurrentActivityOpeningPeriod } from "@/lib/api/activity-opening-period";
import { ActivityOpeningPeriodResponse } from "@/lib/interfaces/activity-opening-period";
import {
  ActivityResponse,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils/date-utils";
import { ActivityStatusBadge } from "@/components/custom/activity/activity-status-badge";
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";
import { toast } from "sonner";

// ========================
// ACTIVITY CARD COMPONENT
// ========================

interface ActivityCardProps {
  activity: ActivityResponse;
  onClick: (id: string) => void;
}

function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const isClosed = activity.status === "COMPLETED";
  const recruiting = activity.status === "OPEN";

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md p-0`}
      onClick={() => onClick(activity.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(activity.id);
        }
      }}
    >
      <CardContent className="p-5 flex flex-col h-full">
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <ActivityTypeBadge activityType={activity.activityType} />
          <ActivityStatusBadge status={activity.status} />
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold tracking-tight mb-1.5 leading-snug">
          {activity.title}
        </h3>

        {/* Description — always reserve 2 lines to keep card heights consistent */}
        <p
          className={`text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 whitespace-pre-line ${
            !activity.description ? "invisible select-none" : ""
          }`}
        >
          {activity.description || "　"}
        </p>

        {/* Divider */}
        <div className="border-t border-slate-100 mt-3 mb-3" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate font-medium text-foreground">
                {activity.assignee.name || activity.assignee.username}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {formatDate(activity.startDate)} ~{" "}
                {formatDate(activity.endDate)}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant={recruiting ? "default" : "outline"}
            disabled={isClosed}
            className="h-8 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onClick(activity.id);
            }}
          >
            <span className="text-xs">
              {recruiting ? "참여하기" : isClosed ? "종료" : "보기"}
            </span>
            {!isClosed && <ChevronRight className="h-3 w-3 ml-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================
// MAIN COMPONENT
// ========================

const ACTIVITIES_PER_PAGE = 10;
const ACTIVITY_TYPE_ORDER: Record<string, number> = {
  SPECIAL_LECTURE: 0,
  PROJECT: 1,
  STUDY: 2,
  LECTURE: 3,
};

const ActivityPage = () => {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [currentQuarterId, setCurrentQuarterId] = useState<string>("");
  const [openingPeriod, setOpeningPeriod] =
    useState<ActivityOpeningPeriodResponse | null>(null);
  const [openingPeriodLoaded, setOpeningPeriodLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [typesData, currentQuarter] = await Promise.all([
          getAllActivityTypes(),
          getCurrentQuarter(),
        ]);
        setActivityTypes(typesData);
        setCurrentQuarterId(currentQuarter.id);
      } catch (error: unknown) {
        console.error("Failed to fetch initial data:", error);
        toast.error(
          "데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
        );
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    getCurrentActivityOpeningPeriod()
      .then(setOpeningPeriod)
      .catch(() => setOpeningPeriod(null))
      .finally(() => setOpeningPeriodLoaded(true));
  }, []);

  useEffect(() => {
    if (!currentQuarterId) return;
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await searchActivities({
          title: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          activityTypeId:
            activityTypeFilter !== "all" ? activityTypeFilter : undefined,
          quarterId: currentQuarterId,
        });
        setActivities(data);
      } catch (error: unknown) {
        console.error("Failed to fetch activities:", error);
        toast.error(
          "활동 데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
        );
        setActivities([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    fetchActivities();
  }, [activityTypeFilter, statusFilter, searchTerm, currentQuarterId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activityTypeFilter, statusFilter, searchTerm, currentQuarterId]);

  const totalPages = Math.max(
    1,
    Math.ceil(activities.length / ACTIVITIES_PER_PAGE),
  );
  const sortedActivities = useMemo(
    () =>
      [...activities].sort(
        (a, b) =>
          (ACTIVITY_TYPE_ORDER[a.activityType.code] ?? Number.MAX_SAFE_INTEGER) -
          (ACTIVITY_TYPE_ORDER[b.activityType.code] ?? Number.MAX_SAFE_INTEGER),
      ),
    [activities],
  );
  const paginatedActivities = sortedActivities.slice(
    (currentPage - 1) * ACTIVITIES_PER_PAGE,
    currentPage * ACTIVITIES_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleClearFilters = () => {
    setActivityTypeFilter("all");
    setStatusFilter("all");
    setSearchInput("");
    setSearchTerm("");
  };

  const hasFilters =
    activityTypeFilter !== "all" || statusFilter !== "all" || searchTerm !== "";

  const openingPeriodMessage = (() => {
    if (!openingPeriod) {
      return openingPeriodLoaded
        ? "활동 개설 신청 기간을 확인할 수 없습니다."
        : "활동 개설 신청 기간을 확인하는 중입니다.";
    }
    if (openingPeriod.status === "OPEN" && openingPeriod.endAt) {
      return `${new Date(openingPeriod.endAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}까지 개설 신청을 받습니다.`;
    }
    if (openingPeriod.status === "UPCOMING" && openingPeriod.startAt) {
      return `${new Date(openingPeriod.startAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}부터 개설 신청이 가능합니다.`;
    }
    if (openingPeriod.status === "CLOSED") return "이번 분기 활동 개설 신청이 마감되었습니다.";
    if (openingPeriod.status === "DISABLED") return "현재 활동 개설 신청 접수가 중지되어 있습니다.";
    return "활동 개설 신청 기간이 아직 설정되지 않았습니다.";
  })();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">모든 활동</h1>
        <p className="text-sm text-muted-foreground">
          이번 분기에 개설된 활동을 확인하고 참여하세요
        </p>
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex items-center w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="활동 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearchTerm(searchInput);
              }}
              className="pl-9 h-9"
            />
          </div>

          <Select
            value={activityTypeFilter}
            onValueChange={setActivityTypeFilter}
          >
            <SelectTrigger className="w-full sm:w-32 h-9 text-xs">
              <SelectValue placeholder="전체 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                전체 유형
              </SelectItem>
              {activityTypes.map((type) => (
                <SelectItem key={type.id} value={type.id} className="text-xs">
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 h-9 text-xs">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                전체 상태
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

          {hasFilters && (
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              초기화
            </Button>
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/activity-opening/my")}
          >
            <span className="text-xs">내 개설 신청</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            title={openingPeriodMessage}
            disabled={!openingPeriod?.canApply}
            onClick={() => router.push("/activity-opening/apply")}
          >
            <Plus className="h-3 w-3" />
            <span className="text-xs">
              {openingPeriod?.status === "CLOSED" ? "신청 마감" : openingPeriod?.status === "UPCOMING" ? "신청 예정" : "활동 개설 신청"}
            </span>
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && initialLoad && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: ACTIVITIES_PER_PAGE }, (_, index) => (
            <Card key={index} className="p-0">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="border-t pt-3 flex justify-between items-end">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty: no activities */}
      {!loading && activities.length === 0 && !hasFilters && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              이번 분기 활동이 없습니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty: filtered */}
      {!loading && activities.length === 0 && hasFilters && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              조건에 맞는 활동이 없습니다
            </p>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <p className="text-sm text-muted-foreground">필터 초기화</p>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activity grid */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {paginatedActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onClick={(id) => router.push(`/activities/${id}`)}
            />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t pt-5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="이전 페이지"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-16 text-center text-sm font-medium text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="다음 페이지"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
