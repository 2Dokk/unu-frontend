"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getNoticeUnreadSummary,
  markNoticeRead,
} from "@/lib/api/notice";
import { useAuth } from "@/lib/contexts/AuthContext";

interface NoticeUnreadContextValue {
  totalCount: number;
  unreadNoticeIds: ReadonlySet<string>;
  refresh: () => Promise<void>;
  markRead: (noticeId: string) => Promise<void>;
}

const EMPTY_IDS = new Set<string>();
const NoticeUnreadContext = createContext<NoticeUnreadContextValue | null>(null);

export function NoticeUnreadProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [unreadNoticeIds, setUnreadNoticeIds] = useState<Set<string>>(EMPTY_IDS);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadNoticeIds(EMPTY_IDS);
      return;
    }
    try {
      const summary = await getNoticeUnreadSummary();
      setUnreadNoticeIds(new Set(summary.noticeIds));
    } catch (error) {
      console.error("Failed to fetch unread notices:", error);
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
    async (noticeId: string) => {
      setUnreadNoticeIds((current) => {
        if (!current.has(noticeId)) return current;
        const next = new Set(current);
        next.delete(noticeId);
        return next;
      });

      try {
        await markNoticeRead(noticeId);
      } catch (error) {
        await refresh();
        throw error;
      }
    },
    [refresh],
  );

  return (
    <NoticeUnreadContext.Provider
      value={{
        totalCount: unreadNoticeIds.size,
        unreadNoticeIds,
        refresh,
        markRead,
      }}
    >
      {children}
    </NoticeUnreadContext.Provider>
  );
}

export function useNoticeUnread() {
  const context = useContext(NoticeUnreadContext);
  if (!context) {
    throw new Error("useNoticeUnread must be used within NoticeUnreadProvider");
  }
  return context;
}
