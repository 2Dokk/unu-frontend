"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useMyActivities } from "@/lib/hooks/useMyActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading, currentQuarter, participations, hostedActivities } =
    useMyActivities();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const currentQuarterActivities = participations.filter(
    (p) =>
      p.participant.activity?.quarter?.id === currentQuarter?.id &&
      p.participant.status !== "REJECTED",
  );
  const currentQuarterHostedActivities = hostedActivities.filter(
    ({ activity }) => activity.quarter?.id === currentQuarter?.id,
  );

  const completedCount = participations.filter(
    (p) => p.participant.completed,
  ).length;

  const confirmedActivities = participations.filter(
    (p) => p.participant.status === "APPROVED",
  );
  const totalActivities = confirmedActivities.length + hostedActivities.length;

  const averageAttendance =
    confirmedActivities.length > 0
      ? confirmedActivities.reduce((acc, p) => acc + p.attendanceRate, 0) /
        confirmedActivities.length
      : 0;

  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
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
    <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">내 활동</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          신청·참여 중인 활동과 직접 개설한 활동을 확인하세요
        </p>
      </div>

      <div className="space-y-10">
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="gap-0 py-4">
              <CardHeader className="flex flex-row items-center justify-between px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  이번 분기 활동
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4">
                <div className="text-2xl font-bold">
                  {currentQuarterActivities.length +
                    currentQuarterHostedActivities.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentQuarter?.name || ""}
                </p>
              </CardContent>
            </Card>

            <button
              type="button"
              className="text-left"
              onClick={() => router.push("/home/completed")}
            >
              <Card className="h-full cursor-pointer gap-0 py-4 transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between px-4">
                  <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    수료 활동
                    <ArrowRight className="h-3 w-3" />
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4">
                  <div className="text-2xl font-bold">{completedCount}</div>
                  <p className="text-xs text-muted-foreground">누적 수료 수</p>
                </CardContent>
              </Card>
            </button>

            <button
              type="button"
              className="text-left"
              onClick={() => router.push("/home/activities")}
            >
              <Card className="h-full cursor-pointer gap-0 py-4 transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between px-4">
                  <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    전체 참여 활동
                    <ArrowRight className="h-3 w-3" />
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4">
                  <div className="text-2xl font-bold">{totalActivities}</div>
                  <p className="text-xs text-muted-foreground">누적 활동 수</p>
                </CardContent>
              </Card>
            </button>

            <Card className="gap-0 py-4">
              <CardHeader className="flex flex-row items-center justify-between px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  평균 출석률
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4">
                <div className="text-2xl font-bold">
                  {averageAttendance.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">전체 평균</p>
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
              <h2 className="text-lg font-semibold tracking-tight">
                내가 신청·참여한 활동
              </h2>

        {currentQuarterActivities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                이번 분기에 신청하거나 참여한 활동이 없습니다
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer gap-2 py-4 transition-shadow hover:shadow-md"
                    onClick={() =>
                      router.push(
                        `/activities/${participant.activity.id}?from=home`,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(
                          `/activities/${participant.activity.id}?from=home`,
                        );
                      }
                    }}
                  >
                    <CardHeader className="px-4">
                      <CardTitle className="truncate text-base leading-snug">
                        {participant.activity?.title || "활동명 없음"}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ParticipantStatusBadge status={participant.status} />
                        {participant.status === "APPLIED" ? (
                          <Badge variant="outline">시작 전</Badge>
                        ) : participant.completed ? (
                          <Badge
                            variant="outline"
                            className="border-green-200 bg-green-50 text-green-700"
                          >
                            수료
                          </Badge>
                        ) : (
                          <Badge variant="outline">진행 중</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4">
                      {participant.status === "APPLIED" ? (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(participant.activity.startDate)}에 참여가
                          확정됩니다.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              출석
                            </span>
                            <span className="font-medium">
                              {attendedCount} / {totalSessions} ·{" "}
                              {attendanceRate.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={attendanceRate} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold tracking-tight">
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
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {currentQuarterHostedActivities.map(
                    ({ activity, participantCount }) => (
                      <button
                        key={activity.id}
                        type="button"
                        className="text-left"
                        onClick={() =>
                          router.push(
                            `/manage/activities/${activity.id}?from=home`,
                          )
                        }
                      >
                        <Card className="h-full gap-2 py-4 transition-shadow hover:shadow-md">
                          <CardHeader className="px-4">
                            <CardTitle className="truncate text-base leading-snug">
                              {activity.title}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <ActivityTypeBadge
                                activityType={activity.activityType}
                              />
                              <ActivityStatusBadge status={activity.status} />
                            </div>
                          </CardHeader>
                          <CardContent className="px-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                참여자{" "}
                                <strong className="text-foreground">
                                  {participantCount}명
                                </strong>
                              </span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(activity.startDate)} ~{" "}
                              {formatDate(activity.endDate)}
                            </p>
                          </CardContent>
                        </Card>
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
