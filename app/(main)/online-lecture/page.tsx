"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import OnlineLectureApp from "@/components/custom/online-lecture/OnlineLectureApp";
import LectureAdminView from "@/components/custom/online-lecture/LectureAdminView";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLectureParticipation } from "@/lib/hooks/useLectureParticipation";

export default function OnlineLecturePage() {
  const router = useRouter();
  const { hasRole, isLoading: authLoading } = useAuth();
  const isManager = hasRole("MANAGER");
  const { loading: participationLoading, participant } = useLectureParticipation();

  const canAccess = isManager || !!participant;
  const loading = authLoading || (!isManager && participationLoading);

  useEffect(() => {
    if (loading || canAccess) return;
    toast.error("인강 신청자만 접근할 수 있는 페이지입니다.");
    router.replace("/home");
  }, [loading, canAccess, router]);

  if (loading || !canAccess) return null;

  if (isManager) {
    return <LectureAdminView />;
  }

  return (
    <OnlineLectureApp
      autoLogin={
        participant
          ? { studentId: participant.user.studentId, name: participant.user.name }
          : null
      }
    />
  );
}
