"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useActivityNoticeUnread } from "@/lib/contexts/ActivityNoticeUnreadContext";
import { useNoticeUnread } from "@/lib/contexts/NoticeUnreadContext";
import { useMenuNotification } from "@/lib/contexts/MenuNotificationContext";
import { useLectureParticipation } from "@/lib/hooks/useLectureParticipation";
import { getMenuByRole } from "@/lib/constants/menu-config";

/**
 * 사이드탭 메뉴에 뜨는 알림 뱃지를 한 곳에서 계산한다.
 * 사이드바와 네비바가 같은 기준을 쓰도록 하기 위한 공용 훅.
 */
export function useSidebarBadges() {
  const { userRole, roles, hasRole } = useAuth();
  const { totalCount: unreadActivityNoticeCount } = useActivityNoticeUnread();
  const { totalCount: unreadNoticeCount } = useNoticeUnread();
  const {
    activityCount: newActivityCount,
    operationRecruitmentCount: newOperationRecruitmentCount,
  } = useMenuNotification();
  const { loading: lectureLoading, participant: lectureParticipant } =
    useLectureParticipation();

  const canSeeOnlineLecture =
    hasRole("MANAGER") || (!lectureLoading && !!lectureParticipant);

  const visibleHrefs = new Set(
    getMenuByRole(userRole, roles)
      .filter((item) => item.type !== "separator")
      .filter((item) =>
        item.href === "/online-lecture" ? canSeeOnlineLecture : true,
      )
      .map((item) => item.href),
  );

  function getUnreadCount(href: string): number {
    switch (href) {
      case "/notices":
        return unreadNoticeCount;
      case "/operation-recruitments":
        return newOperationRecruitmentCount;
      case "/home":
        return unreadActivityNoticeCount;
      case "/activities":
        return newActivityCount;
      default:
        return 0;
    }
  }

  const hasAnyUnread = [...visibleHrefs].some((href) => getUnreadCount(href) > 0);

  return { getUnreadCount, hasAnyUnread };
}
