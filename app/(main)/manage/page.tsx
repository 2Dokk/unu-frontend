"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAllActivitySessions } from "@/lib/api/activity-session";
import { getAllActivities } from "@/lib/api/activity";
import { getAttendancesBySessionId } from "@/lib/api/attendance";
import { ActivitySessionResponseDto } from "@/lib/interfaces/activity-session";
import {
  ActivityResponse,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { AttendanceResponseDto } from "@/lib/interfaces/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllActivityTypes } from "@/lib/api/activity-type";

interface EnrichedSession {
  session: ActivitySessionResponseDto;
  attendances: AttendanceResponseDto[];
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  스터디: {
    label: "스터디",
    color: "bg-violet-100 text-black border-violet-500",
  },
  프로젝트: {
    label: "프로젝트",
    color: "bg-blue-100 text-black border-blue-500",
  },
};

// Generate color for activity type by index
const getActivityTypeColor = (typeName: string, index: number) => {
  if (CATEGORY_MAP[typeName]) {
    return CATEGORY_MAP[typeName].color;
  }

  const colors = [
    "bg-indigo-600 text-white border-indigo-600",
    "bg-slate-700 text-white border-slate-700",
    "bg-teal-600 text-white border-teal-600",
    "bg-violet-600 text-white border-violet-600",
    "bg-amber-600 text-white border-amber-600",
    "bg-zinc-700 text-white border-zinc-700",
    "bg-stone-700 text-white border-stone-700",
  ];

  return colors[index % colors.length];
};
export default function ManagePage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivityTypeIds, setSelectedActivityTypeIds] = useState<
    number[]
  >([]);
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<EnrichedSession | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("MANAGER"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !hasRole("MANAGER")) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [sessionsData, activitiesData, activityTypesData] =
          await Promise.all([
            getAllActivitySessions(),
            getAllActivities(),
            getAllActivityTypes(),
          ]);

        // Create activity lookup map
        const activityMap = new Map<number, ActivityResponse>();
        activitiesData.forEach((activity) => {
          activityMap.set(activity.id, activity);
        });

        // Enrich sessions with activity data and attendances
        const enrichedSessions = await Promise.all(
          sessionsData.map(async (session) => {
            const activity = activityMap.get(session.activity.id) || null;
            let attendances: AttendanceResponseDto[] = [];

            try {
              attendances = await getAttendancesBySessionId(session.id);
            } catch (error) {
              console.error(
                `Failed to fetch attendances for session ${session.id}`,
              );
            }

            return {
              session,
              activity,
              attendances,
            };
          }),
        );

        setSessions(enrichedSessions);
        setActivityTypes(activityTypesData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, hasRole]);

  const filteredSessions = sessions.filter((enriched) => {
    // If no filters selected, show all
    if (selectedActivityTypeIds.length === 0) return true;

    // Check if activity's type is in selected filters
    const activityTypeId = enriched.session.activity.activityType.id;
    return activityTypeId
      ? selectedActivityTypeIds.includes(activityTypeId)
      : false;
  });

  const handleActivityTypeToggle = (typeId: number) => {
    setSelectedActivityTypeIds((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("MANAGER")) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">운영 대시보드</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          활동 세션 일정 및 참석 관리
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-45 text-center">
            <h2 className="text-lg font-semibold">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            오늘
          </Button>
        </div>

        {/* Category Filter */}
        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              활동 유형 필터
              {selectedActivityTypeIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedActivityTypeIds([])}
                  className="h-4 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  초기화
                </Button>
              )}
            </Label>
            <div className="flex flex-wrap gap-4">
              {activityTypes.map((type, index) => {
                const isChecked = selectedActivityTypeIds.includes(type.id);
                const categoryColor = getActivityTypeColor(type.name, index);

                return (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={isChecked}
                      onCheckedChange={() => handleActivityTypeToggle(type.id)}
                    />
                    <Label
                      htmlFor={`type-${type.id}`}
                      className="cursor-pointer"
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          "cursor-pointer transition-all",
                          isChecked && categoryColor,
                        )}
                      >
                        {type.name}
                      </Badge>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content: Calendar + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Calendar */}
        <CalendarView
          currentDate={currentDate}
          sessions={filteredSessions}
          selectedSession={selectedSession}
          onSelectSession={setSelectedSession}
          activityTypes={activityTypes}
        />

        {/* Session Detail Panel */}
        <SessionDetailPanel
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      </div>
    </div>
  );
}

// Calendar Component
interface CalendarViewProps {
  currentDate: Date;
  sessions: EnrichedSession[];
  selectedSession: EnrichedSession | null;
  onSelectSession: (session: EnrichedSession) => void;
  activityTypes: ActivityTypeResponse[];
}

function CalendarView({
  currentDate,
  sessions,
  selectedSession,
  onSelectSession,
  activityTypes,
}: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day and total days in month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Group sessions by date
  const sessionsByDate = new Map<string, EnrichedSession[]>();
  sessions.forEach((enriched) => {
    const date = enriched.session.date;
    if (!sessionsByDate.has(date)) {
      sessionsByDate.set(date, []);
    }
    sessionsByDate.get(date)?.push(enriched);
  });

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
            <div
              key={day}
              className={cn(
                "text-center text-sm font-medium py-2",
                idx === 0 && "text-red-600",
                idx === 6 && "text-blue-600",
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateString = formatDate(day);
            const daySessions = sessionsByDate.get(dateString) || [];
            const isSelectedDate = daySessions.some(
              (s) => s.session.id === selectedSession?.session.id,
            );

            return (
              <div
                key={day}
                className={cn(
                  "aspect-[4/5] border rounded-lg p-2 relative",
                  isToday(day) && "bg-primary/5 border-primary font-semibold",
                  isSelectedDate && "ring-2 ring-primary",
                  daySessions.length > 0 && "hover:bg-muted/50 cursor-pointer",
                )}
              >
                <div className="text-sm mb-1">{day}</div>

                {/* Session Indicators */}
                <div className="space-y-1">
                  {daySessions.slice(0, 2).map((enriched) => {
                    const categoryName =
                      enriched.session.activity?.activityType?.name || "";
                    const typeIndex = activityTypes.findIndex(
                      (t) => t.name === categoryName,
                    );
                    const categoryColor = getActivityTypeColor(
                      categoryName,
                      typeIndex,
                    );

                    return (
                      <button
                        key={enriched.session.id}
                        onClick={() => onSelectSession(enriched)}
                        className={cn(
                          "w-full text-left px-1 py-0.5 rounded text-xs truncate border-l-[3px] relative",
                          categoryColor,
                          enriched.session.id === selectedSession?.session.id &&
                            "ring-1 ring-primary",
                        )}
                      >
                        {enriched.session.activity?.title || "세션"}
                      </button>
                    );
                  })}

                  {daySessions.length > 2 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-xs text-muted-foreground hover:text-foreground text-center w-full px-1 py-0.5 rounded border border-dashed hover:border-solid hover:bg-muted/50 transition-colors cursor-pointer">
                          +{daySessions.length - 2}개 더보기
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-sm">
                              {formatDate(day)}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              총 {daySessions.length}건
                            </p>
                          </div>
                          <Separator />
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {daySessions.map((enriched) => {
                              const categoryName =
                                enriched.session.activity?.activityType?.name ||
                                "";
                              const typeIndex = activityTypes.findIndex(
                                (t) => t.name === categoryName,
                              );
                              const categoryColor = getActivityTypeColor(
                                categoryName,
                                typeIndex,
                              );

                              return (
                                <button
                                  key={enriched.session.id}
                                  onClick={() => {
                                    onSelectSession(enriched);
                                  }}
                                  className={cn(
                                    "w-full text-left px-2 py-1 rounded text-xs truncate border-l-4 relative hover:bg-muted/50 transition-colors",
                                    categoryColor,
                                  )}
                                >
                                  <div className="font-medium">
                                    {enriched.session.activity?.title || "세션"}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Session Detail Panel Component
interface SessionDetailPanelProps {
  session: EnrichedSession | null;
  onClose: () => void;
}

function SessionDetailPanel({ session }: SessionDetailPanelProps) {
  if (!session) {
    return (
      <Card className="lg:sticky lg:top-4">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            세션을 선택하면 상세 정보가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { session: sessionData, attendances } = session;
  const categoryName = session.session.activity?.activityType?.name || "";
  const categoryColor = CATEGORY_MAP[categoryName]
    ? CATEGORY_MAP[categoryName].color
    : "bg-gray-200 text-gray-800 border-gray-300";

  const attendanceStats = {
    present: attendances.filter((a) => a.status === "PRESENT").length,
    absent: attendances.filter((a) => a.status === "ABSENT").length,
    excused: attendances.filter((a) => a.status === "EXCUSED").length,
    total: attendances.length,
  };

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="text-xl">
            {session.session.activity?.title || "활동명 없음"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={categoryColor}>
              {categoryName || "기타"}
            </Badge>
            <Badge variant="secondary">세션 {sessionData.sessionNumber}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Session Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">날짜:</span>
            <span>{sessionData.date}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">참석자:</span>
            <span>
              {attendanceStats.present + attendanceStats.excused} /{" "}
              {attendanceStats.total}
            </span>
          </div>

          {sessionData.description && (
            <div className="text-sm">
              <p className="font-medium mb-1">설명:</p>
              <p className="text-muted-foreground">{sessionData.description}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Attendance Overview */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">출석 현황</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">
                {attendanceStats.present}
              </div>
              <div className="text-xs text-green-600">출석</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {attendanceStats.excused}
              </div>
              <div className="text-xs text-yellow-600">사유</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-700">
                {attendanceStats.absent}
              </div>
              <div className="text-xs text-red-600">결석</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Participant List */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">참가자 목록</h4>
          <ScrollArea className="h-75">
            <div className="space-y-2">
              {attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  참가자 정보가 없습니다.
                </p>
              ) : (
                attendances.map((attendance) => {
                  const userName =
                    attendance.participant?.user?.name || "이름 없음";
                  const isPresent = attendance.status === "PRESENT";
                  const isExcused = attendance.status === "EXCUSED";
                  const isAbsent = attendance.status === "ABSENT";

                  return (
                    <div
                      key={attendance.participant.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPresent && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            출석
                          </Badge>
                        )}
                        {isExcused && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            사유
                          </Badge>
                        )}
                        {isAbsent && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            결석
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
