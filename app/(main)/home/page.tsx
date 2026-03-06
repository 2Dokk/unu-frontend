"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getMyActivityParticipants } from "@/lib/api/activity-participant";
import { getAttendanceStatsByParticipantId } from "@/lib/api/attendance";
import { getActivitySessionsByActivityId } from "@/lib/api/activity-session";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import { AttendanceStatsResponseDto } from "@/lib/interfaces/attendance";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ParticipationWithStats {
  participant: ActivityParticipantResponse;
  attendanceStats: AttendanceStatsResponseDto;
  totalSessions: number;
  attendanceRate: number;
}

const STATUS_MAP = {
  APPLIED: { label: "신청됨", variant: "secondary" as const },
  APPROVED: { label: "승인됨", variant: "default" as const },
  REJECTED: { label: "거절됨", variant: "destructive" as const },
};

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentQuarter, setCurrentQuarter] = useState<QuarterResponse | null>(
    null,
  );
  const [participations, setParticipations] = useState<
    ParticipationWithStats[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch current quarter and participations in parallel
        const [quarterData, participantData] = await Promise.all([
          getCurrentQuarter(),
          getMyActivityParticipants(),
        ]);

        setCurrentQuarter(quarterData);

        // Fetch stats for each participation
        const enrichedData = await Promise.all(
          participantData.map(async (participant) => {
            try {
              const [attendanceStats, sessions] = await Promise.all([
                getAttendanceStatsByParticipantId(participant.id),
                getActivitySessionsByActivityId(participant.activity.id),
              ]);

              const totalSessions = sessions.length;
              const attendedSessions =
                attendanceStats.presentCount + attendanceStats.excusedCount;
              const attendanceRate =
                totalSessions > 0
                  ? (attendedSessions / totalSessions) * 100
                  : 0;

              return {
                participant,
                attendanceStats,
                totalSessions,
                attendanceRate,
              };
            } catch (error) {
              console.error(
                `Failed to fetch stats for participant ${participant.id}:`,
                error,
              );
              return {
                participant,
                attendanceStats: {
                  presentCount: 0,
                  absentCount: 0,
                  excusedCount: 0,
                },
                totalSessions: 0,
                attendanceRate: 0,
              };
            }
          }),
        );

        setParticipations(enrichedData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Calculate summary stats
  const currentQuarterActivities = participations.filter(
    (p) => p.participant.activity?.quarter?.id === currentQuarter?.id,
  );

  const currentQuarterCompleted = currentQuarterActivities.filter(
    (p) => p.participant.completed,
  ).length;

  const totalActivities = participations.length;

  const averageAttendance =
    participations.length > 0
      ? participations.reduce((acc, p) => acc + p.attendanceRate, 0) /
        participations.length
      : 0;

  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">내 활동</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          활동 참여 현황과 출석 정보를 확인하세요
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 분기 활동
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentQuarterActivities.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentQuarter?.name || ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              수료 활동
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentQuarterCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">이번 분기 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 참여 활동
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities}</div>
            <p className="text-xs text-muted-foreground mt-1">누적 활동 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 출석률
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageAttendance.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">전체 평균</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Current Quarter Activities */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">이번 분기 활동</h2>
          <p className="text-muted-foreground mt-1">
            {currentQuarter?.name} 진행 중인 활동
          </p>
        </div>

        {currentQuarterActivities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                이번 분기에 참여한 활동이 없습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {currentQuarterActivities.map(
              ({
                participant,
                attendanceStats,
                totalSessions,
                attendanceRate,
              }) => {
                const statusInfo = STATUS_MAP[participant.status];
                const attendedCount =
                  attendanceStats.presentCount + attendanceStats.excusedCount;

                return (
                  <Card
                    key={participant.id}
                    className="hover:shadow-md transition-shadow"
                    onClick={() =>
                      router.push(`/activities/${participant.activity.id}`)
                    }
                    onMouseOver={() => (document.body.style.cursor = "pointer")}
                    onMouseOut={() => (document.body.style.cursor = "default")}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {participant.activity?.title || "활동명 없음"}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                            {participant.completed ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                수료
                              </Badge>
                            ) : (
                              <Badge variant="outline">진행 중</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            출석
                          </span>
                          <span className="font-medium">
                            {attendedCount} / {totalSessions} 출석
                          </span>
                        </div>
                        <Progress value={attendanceRate} className="h-2" />
                        <p className="text-xs text-right text-muted-foreground">
                          {attendanceRate.toFixed(0)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        )}
      </section>

      <Separator />

      {/* All Activities History */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">전체 활동</h2>
          <p className="text-muted-foreground mt-1">모든 활동 참여 이력</p>
        </div>

        {participations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                아직 참여한 활동이 없습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {participations.map(
                  ({
                    participant,
                    attendanceStats,
                    totalSessions,
                    attendanceRate,
                  }) => {
                    const attendedCount =
                      attendanceStats.presentCount +
                      attendanceStats.excusedCount;

                    return (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {participant.activity?.title || "활동명 없음"}
                              </p>
                              {participant.completed && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  수료
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {participant.activity?.quarter?.name ||
                                "분기 정보 없음"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {attendedCount} / {totalSessions}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              출석률 {attendanceRate.toFixed(0)}%
                            </p>
                          </div>
                          <div className="w-24">
                            <Progress value={attendanceRate} className="h-2" />
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
