"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Users } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useMyActivities } from "@/lib/hooks/useMyActivities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";
import { ActivityStatusBadge } from "@/components/custom/activity/activity-status-badge";
import { ParticipantStatusBadge } from "@/components/custom/participant/partipant-status-badge";
import { formatDate } from "@/lib/utils/date-utils";

type Filter = "all" | "hosted" | "joined";

const FILTER_LABELS: Record<Filter, string> = {
  all: "전체",
  hosted: "내가 개설한 활동",
  joined: "내가 신청·참여한 활동",
};

export default function AllActivitiesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading, participations, hostedActivities } = useMyActivities();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const joined = participations
    .filter((p) => p.participant.status === "APPROVED")
    .sort((a, b) =>
      (b.participant.activity?.startDate ?? "").localeCompare(
        a.participant.activity?.startDate ?? "",
      ),
    );

  const showHosted = filter === "all" || filter === "hosted";
  const showJoined = filter === "all" || filter === "joined";
  const visibleCount =
    (showHosted ? hostedActivities.length : 0) +
    (showJoined ? joined.length : 0);

  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8">
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => router.push("/home")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          내 활동으로
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">전체 참여 활동</h1>
        <p className="text-sm text-muted-foreground">
          직접 개설한 활동과 신청·참여한 활동 {visibleCount}개
        </p>
      </div>

      <div className="flex justify-end">
        <Select value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
              <SelectItem key={key} value={key}>
                {FILTER_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visibleCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">해당하는 활동이 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {showHosted && hostedActivities.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-base font-semibold tracking-tight">
                내가 개설한 활동
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {hostedActivities.length}개
                </span>
              </h2>
              <Card className="py-0">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {hostedActivities.map(({ activity, participantCount }) => (
                      <div
                        key={activity.id}
                        role="button"
                        tabIndex={0}
                        className="flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
                        onClick={() =>
                          router.push(`/manage/activities/${activity.id}?from=home`)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(
                              `/manage/activities/${activity.id}?from=home`,
                            );
                          }
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{activity.title}</p>
                            <Badge variant="outline">개설</Badge>
                            <ActivityTypeBadge
                              activityType={activity.activityType}
                            />
                            <ActivityStatusBadge status={activity.status} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(activity.startDate)} ~{" "}
                            {formatDate(activity.endDate)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="font-medium text-foreground">
                            {participantCount}명
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {showJoined && joined.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-base font-semibold tracking-tight">
                내가 신청·참여한 활동
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {joined.length}개
                </span>
              </h2>
              <Card className="py-0">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {joined.map(
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
                            role="button"
                            tabIndex={0}
                            className="flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
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
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">
                                  {participant.activity?.title || "활동명 없음"}
                                </p>
                                <ParticipantStatusBadge
                                  status={participant.status}
                                />
                                {participant.completed && (
                                  <Badge
                                    variant="outline"
                                    className="border-green-200 bg-green-50 text-green-700"
                                  >
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    수료
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {participant.activity?.quarter?.name ||
                                  "분기 정보 없음"}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {attendedCount} / {totalSessions}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  출석률 {attendanceRate.toFixed(0)}%
                                </p>
                              </div>
                              <div className="hidden w-24 sm:block">
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
            </section>
          )}
        </div>
      )}
    </div>
  );
}
