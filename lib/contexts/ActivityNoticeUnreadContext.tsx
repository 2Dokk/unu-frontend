"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getActivityNoticeUnreadSummary,
  markActivityNoticeRead,
} from "@/lib/api/activity-notice";
import { useAuth } from "@/lib/contexts/AuthContext";

interface UnreadState {
  totalCount: number;
  byActivity: Record<string, number>;
}

interface ActivityNoticeUnreadContextValue extends UnreadState {
  refresh: () => Promise<void>;
  markRead: (noticeId: string, activityId: string) => Promise<void>;
}

const EMPTY_STATE: UnreadState = { totalCount: 0, byActivity: {} };

const ActivityNoticeUnreadContext =
  createContext<ActivityNoticeUnreadContextValue | null>(null);

export function ActivityNoticeUnreadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [state, setState] = useState<UnreadState>(EMPTY_STATE);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setState(EMPTY_STATE);
      return;
    }
    try {
      const summary = await getActivityNoticeUnreadSummary();
      setState({
        totalCount: summary.totalCount,
        byActivity: Object.fromEntries(
          summary.activities.map(({ activityId, count }) => [activityId, count]),
        ),
      });
    } catch (error) {
      console.error("Failed to fetch unread activity notices:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;
    const initialRefreshId = window.setTimeout(() => void refresh(), 0);
    if (!isAuthenticated) {
      return () => window.clearTimeout(initialRefreshId);
    }

    const intervalId = window.setInterval(() => void refresh(), 60_000);
    const handleFocus = () => void refresh();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, isLoading, refresh]);

  const markRead = useCallback(
    async (noticeId: string, activityId: string) => {
      setState((current) => {
        const activityCount = current.byActivity[activityId] ?? 0;
        if (activityCount === 0) return current;
        const nextCount = activityCount - 1;
        const nextByActivity = { ...current.byActivity };
        if (nextCount === 0) delete nextByActivity[activityId];
        else nextByActivity[activityId] = nextCount;
        return {
          totalCount: Math.max(0, current.totalCount - 1),
          byActivity: nextByActivity,
        };
      });

      try {
        await markActivityNoticeRead(noticeId);
      } catch (error) {
        await refresh();
        throw error;
      }
    },
    [refresh],
  );

  return (
    <ActivityNoticeUnreadContext.Provider value={{ ...state, refresh, markRead }}>
      {children}
    </ActivityNoticeUnreadContext.Provider>
  );
}

export function useActivityNoticeUnread() {
  const context = useContext(ActivityNoticeUnreadContext);
  if (!context) {
    throw new Error(
      "useActivityNoticeUnread must be used within ActivityNoticeUnreadProvider",
    );
  }
  return context;
}
