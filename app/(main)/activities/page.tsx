"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getAllQuarters } from "@/lib/api/quarter";
import {
  ActivityResponse,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Calendar,
  User,
  Plus,
  Filter,
  X,
  SquarePlus,
} from "lucide-react";

// ========================
// HELPER FUNCTIONS
// ========================

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    CREATED: "준비 중",
    RECRUITING: "모집 중",
    OPEN: "모집 중",
    IN_PROGRESS: "진행 중",
    ONGOING: "진행 중",
    COMPLETED: "종료",
  };
  return statusMap[status] || `상태: ${status}`;
}

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  const variantMap: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    RECRUITING: "default",
    OPEN: "default",
    IN_PROGRESS: "outline",
    ONGOING: "outline",
    COMPLETED: "secondary",
    CREATED: "outline",
  };
  return variantMap[status] || "outline";
}

function getStatusClassName(status: string): string {
  const classMap: Record<string, string> = {
    RECRUITING: "bg-green-50 text-green-700 border-green-200",
    OPEN: "bg-green-50 text-green-700 border-green-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    ONGOING: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-gray-100 text-gray-600 border-gray-200",
    CREATED: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return classMap[status] || "bg-gray-50 text-gray-600 border-gray-200";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function isRecruiting(status: string): boolean {
  return status === "RECRUITING" || status === "OPEN";
}

function isActivityClosed(status: string): boolean {
  return status === "COMPLETED";
}

// ========================
// FILTER TOOLBAR COMPONENT
// ========================

interface FilterToolbarProps {
  activityTypes: ActivityTypeResponse[];
  activityTypeFilter: string;
  setActivityTypeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

function FilterToolbar({
  activityTypes,
  activityTypeFilter,
  setActivityTypeFilter,
  statusFilter,
  setStatusFilter,
  searchInput,
  setSearchInput,
  onSearch,
  onClearFilters,
  hasFilters,
}: FilterToolbarProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        {/* Type Filter */}
        <Select
          value={activityTypeFilter}
          onValueChange={setActivityTypeFilter}
        >
          <SelectTrigger className="w-32 h-9 bg-white">
            <SelectValue placeholder="전체 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            {activityTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
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
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="CREATED">준비 중</SelectItem>
            <SelectItem value="OPEN">모집 중</SelectItem>
            <SelectItem value="ONGOING">진행 중</SelectItem>
            <SelectItem value="COMPLETED">종료</SelectItem>
          </SelectContent>
        </Select>

        {/* Search Input */}
        <div className="flex-1 min-w-52">
          <Input
            placeholder="활동명 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch();
              }
            }}
            className="h-9 bg-white"
          />
        </div>

        {/* Clear Button */}
        {hasFilters && (
          <Button
            onClick={onClearFilters}
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
  );
}

// ========================
// ACTIVITY CARD COMPONENT
// ========================

interface ActivityCardProps {
  activity: ActivityResponse;
  onClick: (id: number) => void;
}

function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const isClosed = isActivityClosed(activity.status);
  const recruiting = isRecruiting(activity.status);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-slate-300 border-slate-200 p-0"
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
      <CardContent className="p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            {activity.activityType.name}
          </Badge>
          <Badge
            className={getStatusClassName(activity.status)}
            variant={getStatusBadgeVariant(activity.status)}
          >
            {getStatusLabel(activity.status)}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold tracking-tight mb-2">
          {activity.title}
        </h3>

        {/* Description */}
        {activity.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
            {activity.description}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100 my-3" />

        {/* Meta Row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {formatDate(activity.startDate)} ~ {formatDate(activity.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>{activity.assignee.name || activity.assignee.username}</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant={isClosed ? "outline" : "default"}
            disabled={isClosed}
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              onClick(activity.id);
            }}
          >
            {recruiting ? "신청하기" : isClosed ? "종료됨" : "상세보기"}
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================
// MAIN COMPONENT
// ========================

const ActivityPage = () => {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Filter states
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  // TODO: Replace with actual viewer logic
  const viewer = { isAdmin: true };

  // Quarter navigation helpers
  const selectedQuarterIndex = quarters.findIndex(
    (q) => q.id.toString() === selectedQuarterId,
  );
  const hasPrevQuarter = selectedQuarterIndex > 0;
  const hasNextQuarter =
    selectedQuarterIndex < quarters.length - 1 && selectedQuarterIndex !== -1;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [typesData, quartersData] = await Promise.all([
          getAllActivityTypes(),
          getAllQuarters(),
        ]);
        setActivityTypes(typesData);
        setQuarters(quartersData);

        // Set the latest quarter as default if available
        if (quartersData.length > 0 && !selectedQuarterId) {
          setSelectedQuarterId(
            quartersData[quartersData.length - 1].id.toString(),
          );
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      // Don't fetch if no quarter is selected
      if (!selectedQuarterId) {
        return;
      }

      setLoading(true);
      try {
        const params = {
          title: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          activityTypeId:
            activityTypeFilter !== "all" ? activityTypeFilter : undefined,
          quarterId: selectedQuarterId,
        };
        const data = await searchActivities(params);
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchActivities();
  }, [activityTypeFilter, statusFilter, searchTerm, selectedQuarterId]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleActivityClick = (activityId: number) => {
    router.push(`/activities/${activityId}`);
  };

  const handlePrevQuarter = () => {
    if (hasPrevQuarter) {
      const prevQuarter = quarters[selectedQuarterIndex - 1];
      setSelectedQuarterId(prevQuarter.id.toString());
    }
  };

  const handleNextQuarter = () => {
    if (hasNextQuarter) {
      const nextQuarter = quarters[selectedQuarterIndex + 1];
      setSelectedQuarterId(nextQuarter.id.toString());
    }
  };

  const handleClearFilters = () => {
    setActivityTypeFilter("all");
    setStatusFilter("all");
    setSearchInput("");
    setSearchTerm("");
  };

  const filteredActivities = activities;
  const hasFilters =
    activityTypeFilter !== "all" || statusFilter !== "all" || searchTerm !== "";

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b pb-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">활동 목록</h1>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              프로젝트와 스터디를 확인하세요
            </p>
          </div>

          {/* Semester Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevQuarter}
              disabled={!hasPrevQuarter}
              aria-label="이전 분기"
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select
              value={selectedQuarterId}
              onValueChange={setSelectedQuarterId}
            >
              <SelectTrigger className="w-40 h-9">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="분기 선택" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {quarters.map((quarter) => (
                  <SelectItem key={quarter.id} value={quarter.id.toString()}>
                    {quarter.year} {quarter.season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextQuarter}
              disabled={!hasNextQuarter}
              aria-label="다음 분기"
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {viewer.isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/activities/new")}
              >
                <SquarePlus className="h-4 w-4 mr-1" />
                활동 생성
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Filter Toolbar */}
      <FilterToolbar
        activityTypes={activityTypes}
        activityTypeFilter={activityTypeFilter}
        setActivityTypeFilter={setActivityTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        hasFilters={hasFilters}
      />

      {/* Loading State */}
      {loading && initialLoad && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="border-t pt-3">
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State - No activities */}
      {!loading && filteredActivities.length === 0 && !hasFilters && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">등록된 활동이 없어요</h3>
                <p className="text-sm text-muted-foreground">
                  새로운 프로젝트나 스터디를 시작해보세요
                </p>
              </div>
              {viewer.isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/activities/new")}
                >
                  <SquarePlus className="h-4 w-4 mr-1" />첫 활동 만들기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No filtered results */}
      {!loading && filteredActivities.length === 0 && hasFilters && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  조건에 맞는 활동이 없어요
                </h3>
                <p className="text-sm text-muted-foreground">
                  다른 필터를 시도해보세요
                </p>
              </div>
              <Button variant="outline" onClick={handleClearFilters}>
                필터 초기화
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Cards List */}
      {!loading && filteredActivities.length > 0 && (
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onClick={handleActivityClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
