"use client";

import { useEffect, useState } from "react";
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
import { getAllQuarters, getCurrentQuarter } from "@/lib/api/quarter";
import {
  ActivityResponse,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { Calendar, ChevronRight, Plus, Search, User, X } from "lucide-react";
import { formatDate } from "@/lib/utils/date-utils";
import { ActivityStatusBadge } from "@/components/custom/activity/activity-status-badge";
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";

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
              {recruiting ? "신청하기" : isClosed ? "종료" : "보기"}
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

  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [typesData, quartersData, currentQuarter] = await Promise.all([
          getAllActivityTypes(),
          getAllQuarters(),
          getCurrentQuarter().catch(() => null),
        ]);
        setActivityTypes(typesData);
        setQuarters(quartersData);
        if (quartersData.length > 0) {
          const defaultId = currentQuarter?.id ?? quartersData[quartersData.length - 1].id;
          setSelectedQuarterId(defaultId.toString());
        }
      } catch (error: any) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedQuarterId) return;
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await searchActivities({
          title: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          activityTypeId:
            activityTypeFilter !== "all" ? activityTypeFilter : undefined,
          quarterId: selectedQuarterId,
        });
        setActivities(data);
      } catch (error: any) {
        console.error("Failed to fetch activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    fetchActivities();
  }, [activityTypeFilter, statusFilter, searchTerm, selectedQuarterId]);

  const handleClearFilters = () => {
    setActivityTypeFilter("all");
    setStatusFilter("all");
    setSearchInput("");
    setSearchTerm("");
  };

  const hasFilters =
    activityTypeFilter !== "all" || statusFilter !== "all" || searchTerm !== "";

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">활동 신청하기</h1>
          <p className="text-sm text-muted-foreground">
            이번 분기에 개설된 활동을 확인하고 신청하세요
          </p>
        </div>

        {/* Semester selector — notion-style page context */}
        <Select value={selectedQuarterId} onValueChange={setSelectedQuarterId}>
          <SelectTrigger className="w-auto h-7 border-0 shadow-none bg-transparent px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md gap-1 [&>svg]:opacity-50">
            <SelectValue placeholder="분기 선택" />
          </SelectTrigger>
          <SelectContent>
            {quarters.map((quarter) => (
              <SelectItem key={quarter.id} value={quarter.id.toString()}>
                {quarter.year} {quarter.season}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter row */}
      <div className="flex justify-between ">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/activities/new")}
        >
          <Plus className="h-3 w-3" />
          <span className="text-xs">활동 만들기</span>
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && initialLoad && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-0">
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
        <div className="grid grid-cols-1 gap-4">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onClick={(id) => router.push(`/activities/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
