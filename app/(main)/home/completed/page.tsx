"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useMyActivities } from "@/lib/hooks/useMyActivities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";

export default function CompletedActivitiesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading, participations } = useMyActivities();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const completed = participations
    .filter((p) => p.participant.completed)
    .sort((a, b) =>
      (b.participant.activity?.startDate ?? "").localeCompare(
        a.participant.activity?.startDate ?? "",
      ),
    );

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
        <h1 className="text-2xl font-bold tracking-tight">수료 활동</h1>
        <p className="text-sm text-muted-foreground">
          지금까지 수료한 활동 {completed.length}개
        </p>
      </div>

      {completed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">아직 수료한 활동이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="divide-y">
              {completed.map(
                ({
                  participant,
                  attendanceStats,
                  totalSessions,
                  attendanceRate,
                }) => {
                  const attendedCount =
                    attendanceStats.presentCount + attendanceStats.excusedCount;

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
                          <Badge
                            variant="outline"
                            className="border-green-200 bg-green-50 text-green-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            수료
                          </Badge>
                          {participant.activity?.activityType && (
                            <ActivityTypeBadge
                              activityType={participant.activity.activityType}
                            />
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
      )}
    </div>
  );
}
