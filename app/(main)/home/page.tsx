"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getMyActivityParticipants } from "@/lib/api/activity-participant";
import { getActivityParticipantsByActivityId } from "@/lib/api/activity-participant";
import { getMyHostedActivities } from "@/lib/api/activity";
import { getAttendanceStatsByParticipantId } from "@/lib/api/attendance";
import { getActivitySessionsByActivityId } from "@/lib/api/activity-session";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import { AttendanceStatsResponseDto } from "@/lib/interfaces/attendance";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { ActivityResponse } from "@/lib/interfaces/activity";
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
  Users,
  ArrowRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ParticipantStatusBadge } from "@/components/custom/participant/partipant-status-badge";
import { ActivityStatusBadge } from "@/components/custom/activity/activity-status-badge";
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";
import { formatDate } from "@/lib/utils/date-utils";

interface ParticipationWithStats {
  participant: ActivityParticipantResponse;
  attendanceStats: AttendanceStatsResponseDto;
  totalSessions: number;
  attendanceRate: number;
}

interface HostedActivityWithParticipants {
  activity: ActivityResponse;
  participantCount: number;
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentQuarter, setCurrentQuarter] = useState<QuarterResponse | null>(
    null,
  );
  const [participations, setParticipations] = useState<
    ParticipationWithStats[]
  >([]);
  const [hostedActivities, setHostedActivities] = useState<
    HostedActivityWithParticipants[]
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
        const [quarterData, participantData, hostedData] = await Promise.all([
          getCurrentQuarter(),
          getMyActivityParticipants(),
          getMyHostedActivities(),
        ]);

        setCurrentQuarter(quarterData);

        // Fetch stats for each participation
        const [enrichedData, hostedWithParticipants] = await Promise.all([
          Promise.all(participantData.map(async (participant) => {
            try {
              const [attendanceStats, sessions] = await Promise.all([
                getAttendanceStatsByParticipantId(participant.id),
                getActivitySessionsByActivityId(participant.activity.id),
              ]);

              const today = new Date();
              const todayValue = [
                today.getFullYear(),
                String(today.getMonth() + 1).padStart(2, "0"),
                String(today.getDate()).padStart(2, "0"),
              ].join("-");
              const totalSessions = sessions.filter(
                (session) => session.date <= todayValue,
              ).length;
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
            } catch (error: any) {
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
          })),
          Promise.all(hostedData.map(async (activity) => {
            try {
              const activityParticipants =
                await getActivityParticipantsByActivityId({
                  activityId: activity.id,
                });
              return {
                activity,
                participantCount: activityParticipants.filter(
                  (participant) => participant.status === "APPROVED",
                ).length,
              };
            } catch (error) {
              console.error(
                `Failed to fetch participants for activity ${activity.id}:`,
                error,
              );
              return { activity, participantCount: 0 };
            }
          })),
        ]);

        setParticipations(enrichedData);
        setHostedActivities(
          hostedWithParticipants.sort((a, b) =>
            b.activity.createdAt.localeCompare(a.activity.createdAt),
          ),
        );
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Calculate summary stats
  const hostedActivityIds = new Set(
    hostedActivities.map(({ activity }) => activity.id),
  );
  const participatingActivities = participations.filter(
    ({ participant }) => !hostedActivityIds.has(participant.activity.id),
  );

  const currentQuarterActivities = participatingActivities.filter(
    (p) => p.participant.activity?.quarter?.id === currentQuarter?.id,
  );
  const currentQuarterHostedActivities = hostedActivities.filter(
    ({ activity }) => activity.quarter?.id === currentQuarter?.id,
  );

  const currentQuarterCompleted = currentQuarterActivities.filter(
    (p) => p.participant.completed,
  ).length;

  const totalActivities = participatingActivities.length;

  const averageAttendance =
    participatingActivities.length > 0
      ? participatingActivities.reduce((acc, p) => acc + p.attendanceRate, 0) /
        participatingActivities.length
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
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">내 활동</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          참여 중인 활동과 직접 개설한 활동을 확인하세요
        </p>
      </div>

      <div className="space-y-10">
        <div className="space-y-8">
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
                  {currentQuarterActivities.length + currentQuarterHostedActivities.length}
                  </div>
                <p className="mt-1 text-xs text-muted-foreground">
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
                <div className="text-2xl font-bold">
                  {currentQuarterCompleted}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  이번 분기 기준
                </p>
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
                <p className="mt-1 text-xs text-muted-foreground">누적 활동 수</p>
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
                <p className="mt-1 text-xs text-muted-foreground">전체 평균</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Quarter Activities */}
          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">이번 분기 활동</h2>
              <p className="mt-1 text-muted-foreground">
                {currentQuarter?.name} 활동 현황
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold tracking-tight">
                내가 참여 중인 활동
              </h3>

        {currentQuarterActivities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                이번 분기에 참여한 활동이 없습니다
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
                            <ParticipantStatusBadge
                              status={participant.status}
                            />
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
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold tracking-tight">
                내가 개설한 활동
              </h3>
              {currentQuarterHostedActivities.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <Users className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      이번 분기에 개설한 활동이 없습니다
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {currentQuarterHostedActivities.map(
                    ({ activity, participantCount }) => (
                      <button
                        key={activity.id}
                        type="button"
                        className="text-left"
                        onClick={() =>
                          router.push(`/manage/activities/${activity.id}`)
                        }
                      >
                        <Card className="h-full transition-shadow hover:shadow-md">
                          <CardHeader className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="min-w-0 text-lg leading-snug">
                                {activity.title}
                              </CardTitle>
                              <ActivityStatusBadge status={activity.status} />
                            </div>
                            <ActivityTypeBadge
                              activityType={activity.activityType}
                            />
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                참여자
                              </span>
                              <strong>{participantCount}명</strong>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(activity.startDate)} -{" "}
                              {formatDate(activity.endDate)}
                            </p>
                            <div className="flex items-center justify-end gap-1 text-sm font-medium">
                              관리 화면 열기
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* All Activities History */}
          <section className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">전체 참여 이력</h3>
          <p className="text-muted-foreground mt-1">모든 활동 참여 이력</p>
        </div>

        {participatingActivities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                아직 참여한 활동이 없습니다
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="py-0">
            <CardContent className="p-0">
              <div className="divide-y">
                {participatingActivities.map(
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
      </div>
    </div>
  );
}
