"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getMenuNotificationSummary,
  markMenuNotificationItemRead,
} from "@/lib/api/menu-notification";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  MenuNotificationFeed,
  MenuNotificationSummary,
} from "@/lib/interfaces/menu-notification";
import { MENU_NOTIFICATION_REFRESH_EVENT } from "@/lib/utils/menu-notification-events";

interface MenuNotificationContextValue extends MenuNotificationSummary {
  refresh: () => Promise<void>;
  markItemViewed: (feed: MenuNotificationFeed, itemId: string) => Promise<void>;
}

const EMPTY_STATE: MenuNotificationSummary = {
  activityCount: 0,
  operationRecruitmentCount: 0,
  activityResultCount: 0,
  newActivityIds: [],
  newOperationRecruitmentIds: [],
  unreadActivityResultIds: [],
};

const MenuNotificationContext =
  createContext<MenuNotificationContextValue | null>(null);

export function MenuNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [state, setState] = useState<MenuNotificationSummary>(EMPTY_STATE);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setState(EMPTY_STATE);
      return;
    }
    try {
      const summary = await getMenuNotificationSummary();
      setState({
        ...summary,
        newActivityIds: summary.newActivityIds ?? [],
        newOperationRecruitmentIds:
          summary.newOperationRecruitmentIds ?? [],
        activityResultCount: summary.activityResultCount ?? 0,
        unreadActivityResultIds: summary.unreadActivityResultIds ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch menu notifications:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;
    const initialRefreshId = window.setTimeout(() => void refresh(), 0);
    if (!isAuthenticated) {
      return () => window.clearTimeout(initialRefreshId);
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60_000);
    const handleFocus = () => void refresh();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const handleRefreshRequest = () => void refresh();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(
      MENU_NOTIFICATION_REFRESH_EVENT,
      handleRefreshRequest,
    );
    return () => {
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        MENU_NOTIFICATION_REFRESH_EVENT,
        handleRefreshRequest,
      );
    };
  }, [isAuthenticated, isLoading, refresh]);

  const markItemViewed = useCallback(
    async (feed: MenuNotificationFeed, itemId: string) => {
      if (!isAuthenticated) return;
      setState((current) => {
        if (feed === "activities") {
          const newActivityIds = current.newActivityIds.filter(
            (id) => id !== itemId,
          );
          return {
            ...current,
            activityCount: newActivityIds.length,
            newActivityIds,
          };
        }
        if (feed === "activity-results") {
          const unreadActivityResultIds =
            current.unreadActivityResultIds.filter((id) => id !== itemId);
          return {
            ...current,
            activityResultCount: unreadActivityResultIds.length,
            unreadActivityResultIds,
          };
        }
        const newOperationRecruitmentIds =
          current.newOperationRecruitmentIds.filter((id) => id !== itemId);
        return {
          ...current,
          operationRecruitmentCount: newOperationRecruitmentIds.length,
          newOperationRecruitmentIds,
        };
      });
      try {
        await markMenuNotificationItemRead(feed, itemId);
      } catch (error) {
        await refresh();
        throw error;
      }
    },
    [isAuthenticated, refresh],
  );

  return (
    <MenuNotificationContext.Provider
      value={{ ...state, refresh, markItemViewed }}
    >
      {children}
    </MenuNotificationContext.Provider>
  );
}

export function useMenuNotification() {
  const context = useContext(MenuNotificationContext);
  if (!context) {
    throw new Error(
      "useMenuNotification must be used within MenuNotificationProvider",
    );
  }
  return context;
}
