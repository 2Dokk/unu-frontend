import axiosInstance from "./axiosInstance";
import {
  MenuNotificationFeed,
  MenuNotificationSummary,
} from "@/lib/interfaces/menu-notification";

export async function getMenuNotificationSummary(): Promise<MenuNotificationSummary> {
  const response = await axiosInstance.get<MenuNotificationSummary>(
    "/menu-notifications/unread-summary",
  );
  return response.data;
}

export async function markMenuNotificationItemRead(
  feed: MenuNotificationFeed,
  itemId: string,
): Promise<void> {
  await axiosInstance.post(`/menu-notifications/${feed}/${itemId}/read`);
}
