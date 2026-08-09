"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getMyActivityParticipants } from "@/lib/api/activity-participant";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";

interface LectureParticipationState {
  /** 아직 서버 확인 중인지. true인 동안엔 접근/노출 여부를 판단하면 안 된다. */
  loading: boolean;
  /** "인강"(LECTURE) 활동에 참여 확정(APPROVED)된 기록. 없으면 null. */
  participant: ActivityParticipantResponse | null;
}

/**
 * 로그인한 회원이 "인강"(LECTURE) 활동에 참여 확정(APPROVED)돼 있는지 매번 서버에서 확인한다.
 * 신청자 명단에서 빠지면(참여 기록 삭제·거절·취소) 다음 확인 때 바로 false로 떨어진다 —
 * 클라이언트에 캐시된 상태를 신뢰하지 않고 서버 쪽 진실을 그대로 따른다.
 */
export function useLectureParticipation(): LectureParticipationState {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] =
    useState<ActivityParticipantResponse | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setParticipant(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const myParticipations = await getMyActivityParticipants();
        const lectureParticipation = myParticipations.find(
          (p) =>
            p.status === "APPROVED" &&
            p.activity?.activityType?.code === "LECTURE",
        );
        if (!cancelled) setParticipant(lectureParticipation ?? null);
      } catch {
        if (!cancelled) setParticipant(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading]);

  return { loading, participant };
}
