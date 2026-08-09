"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import OnlineLectureApp from "@/components/custom/online-lecture/OnlineLectureApp";
import LectureAdminView from "@/components/custom/online-lecture/LectureAdminView";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLectureParticipation } from "@/lib/hooks/useLectureParticipation";

type Tab = "my" | "admin";

export default function OnlineLecturePage() {
  const router = useRouter();
  const { hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const isManager = hasRole("MANAGER");
  const { loading: participationLoading, participant } = useLectureParticipation();
  const [tab, setTab] = useState<Tab>("my");

  const canAccess = isManager || !!participant;
  const loading = authLoading || participationLoading;

  useEffect(() => {
    if (loading || canAccess || !isAuthenticated) return;
    toast.error("인강 신청자만 접근할 수 있는 페이지입니다.");
    router.replace("/home");
  }, [loading, canAccess, isAuthenticated, router]);

  if (loading || !canAccess) return null;

  const showTabs = isManager && !!participant;
  const activeTab = showTabs ? tab : isManager ? "admin" : "my";

  return (
    <>
      {showTabs && (
        <div className="mx-auto flex max-w-[1160px] gap-2 px-5 pt-6 sm:px-7">
          <button
            onClick={() => setTab("my")}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "my" ? "bg-brand-dark text-white" : "text-hint hover:bg-surface-sunken"
            }`}
          >
            내 예약
          </button>
          <button
            onClick={() => setTab("admin")}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "admin" ? "bg-brand-dark text-white" : "text-hint hover:bg-surface-sunken"
            }`}
          >
            현황
          </button>
        </div>
      )}

      {activeTab === "admin" ? (
        <LectureAdminView />
      ) : (
        <OnlineLectureApp
          autoLogin={
            participant
              ? { studentId: participant.user.studentId, name: participant.user.name }
              : null
          }
        />
      )}
    </>
  );
}
