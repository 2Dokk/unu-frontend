"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  getActivityParticipantsByActivityId,
  getMyActivityParticipants,
} from "@/lib/api/activity-participant";
import { getMyHostedActivities } from "@/lib/api/activity";
import { getAttendanceStatsByParticipantId } from "@/lib/api/attendance";
import { getActivitySessionsByActivityId } from "@/lib/api/activity-session";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import { AttendanceStatsResponseDto } from "@/lib/interfaces/attendance";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { ActivityResponse } from "@/lib/interfaces/activity";

export interface ParticipationWithStats {
  participant: ActivityParticipantResponse;
  attendanceStats: AttendanceStatsResponseDto;
  totalSessions: number;
  attendanceRate: number;
}

export interface HostedActivityWithParticipants {
  activity: ActivityResponse;
  participantCount: number;
}

export interface MyActivitiesState {
  loading: boolean;
  currentQuarter: QuarterResponse | null;
  /**
   * 내가 ActivityParticipant로 등록된 모든 활동(개설 여부와 무관).
   * 개설 활동과의 중복 표시 제외는 여기서 걸러내지 않고 UI 렌더링 단계에서 처리한다.
   */
  participations: ParticipationWithStats[];
  hostedActivities: HostedActivityWithParticipants[];
}

function todayValue(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

async function enrichParticipation(
  participant: ActivityParticipantResponse,
): Promise<ParticipationWithStats> {
  try {
    const [attendanceStats, sessions] = await Promise.all([
      getAttendanceStatsByParticipantId(participant.id),
      getActivitySessionsByActivityId(participant.activity.id),
    ]);

    const today = todayValue();
    const totalSessions = sessions.filter(
      (session) => session.date <= today,
    ).length;
    const attendedSessions =
      attendanceStats.presentCount + attendanceStats.excusedCount;
    const attendanceRate =
      totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

    return { participant, attendanceStats, totalSessions, attendanceRate };
  } catch (error) {
    console.error(
      `Failed to fetch stats for participant ${participant.id}:`,
      error,
    );
    return {
      participant,
      attendanceStats: { presentCount: 0, absentCount: 0, excusedCount: 0 },
      totalSessions: 0,
      attendanceRate: 0,
    };
  }
}

async function enrichHostedActivity(
  activity: ActivityResponse,
): Promise<HostedActivityWithParticipants> {
  try {
    const activityParticipants = await getActivityParticipantsByActivityId({
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
}

export function useMyActivities(): MyActivitiesState {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentQuarter, setCurrentQuarter] = useState<QuarterResponse | null>(
    null,
  );
  const [participations, setParticipations] = useState<ParticipationWithStats[]>(
    [],
  );
  const [hostedActivities, setHostedActivities] = useState<
    HostedActivityWithParticipants[]
  >([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [quarterData, participantData, hostedData] = await Promise.all([
          getCurrentQuarter(),
          getMyActivityParticipants(),
          getMyHostedActivities(),
        ]);

        // 개설 활동이라는 이유로 participant를 제거하지 않는다.
        // (개설자라도 APPROVED participant면 출석·수료 집계에 포함돼야 하므로 전량 유지한다.)
        const [enrichedParticipations, enrichedHosted] = await Promise.all([
          Promise.all(participantData.map(enrichParticipation)),
          Promise.all(hostedData.map(enrichHostedActivity)),
        ]);

        if (cancelled) return;

        setCurrentQuarter(quarterData);
        setParticipations(enrichedParticipations);
        setHostedActivities(
          enrichedHosted.sort((a, b) =>
            b.activity.createdAt.localeCompare(a.activity.createdAt),
          ),
        );
      } catch (error) {
        console.error("Failed to fetch my activities:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return { loading, currentQuarter, participations, hostedActivities };
}
