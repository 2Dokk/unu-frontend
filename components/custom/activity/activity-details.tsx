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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getActivityById } from "@/lib/api/activity";
import {
  getMyParticipantByActivityId,
  createMyParticipantByActivityId,
  deleteActivityParticipant,
} from "@/lib/api/activity-participant";
import {
  ActivityResponse,
  ACTIVITY_STATUS_MAP,
} from "@/lib/interfaces/activity";
import {
  ActivityParticipantResponse,
  ACTIVITY_PARTICIPANT_STATUS_MAP,
} from "@/lib/interfaces/activity-participant";
import { Calendar, User, Tag, Clock, ArrowLeft } from "lucide-react";

interface ActivityDetailsProps {
  activityId: number;
}

export function ActivityDetails({ activityId }: ActivityDetailsProps) {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [participant, setParticipant] =
    useState<ActivityParticipantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchActivityDetails = async () => {
      setLoading(true);
      try {
        const [activityData, participantData] = await Promise.all([
          getActivityById(activityId),
          getMyParticipantByActivityId(activityId),
        ]);
        setActivity(activityData);
        setParticipant(participantData);
      } catch (error) {
        console.error("Failed to fetch activity details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityDetails();
  }, [activityId]);

  const handleApply = async () => {
    if (!activity) return;
    setActionLoading(true);
    try {
      const newParticipant = await createMyParticipantByActivityId({
        activityId: activity.id,
      });
      setParticipant(newParticipant);
    } catch (error) {
      console.error("Failed to apply for activity:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!participant) return;
    setActionLoading(true);
    try {
      await deleteActivityParticipant(participant.id);
      setParticipant(null);
    } catch (error) {
      console.error("Failed to cancel activity:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!activity) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">활동을 찾을 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const renderActionButton = () => {
    if (activity.status === "CREATED") {
      return (
        <Button variant="outline" disabled>
          모집 예정
        </Button>
      );
    }

    if (activity.status !== "OPEN") {
      return (
        <Button variant="outline" disabled>
          모집 종료
        </Button>
      );
    }

    if (!participant) {
      return (
        <Button onClick={handleApply} disabled={actionLoading}>
          {actionLoading ? "신청 중..." : "참여 신청"}
        </Button>
      );
    }

    if (participant.status === "APPLIED") {
      return (
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={actionLoading}
        >
          {actionLoading ? "취소 중..." : "신청 취소"}
        </Button>
      );
    }

    return (
      <Badge
        variant={participant.status === "APPROVED" ? "default" : "destructive"}
      >
        {ACTIVITY_PARTICIPANT_STATUS_MAP[participant.status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{activity.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{activity.title}</CardTitle>
              <CardDescription>{activity.description}</CardDescription>
            </div>
            <Badge
              variant={
                activity.status === "OPEN"
                  ? "default"
                  : activity.status === "COMPLETED"
                    ? "secondary"
                    : "outline"
              }
            >
              {ACTIVITY_STATUS_MAP[activity.status] || activity.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />

          {/* 활동 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">활동 유형</p>
                  <p className="font-medium">{activity.activityType.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">담당자</p>
                  <p className="font-medium">{activity.assignee.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">분기</p>
                  <p className="font-medium">{activity.quarter.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">시작일</p>
                  <p className="font-medium">
                    {new Date(activity.startDate).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">종료일</p>
                  <p className="font-medium">
                    {new Date(activity.endDate).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">생성일</p>
                  <p className="font-medium">
                    {new Date(activity.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 참여 상태 및 액션 */}
          <div className="flex items-center justify-between">
            <div>
              {participant && (
                <div>
                  <p className="text-sm text-muted-foreground">참여 상태</p>
                  <p className="font-medium">
                    {ACTIVITY_PARTICIPANT_STATUS_MAP[participant.status]}
                  </p>
                </div>
              )}
            </div>
            <div>{renderActionButton()}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
