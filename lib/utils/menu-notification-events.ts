export const MENU_NOTIFICATION_REFRESH_EVENT =
  "menu-notification-refresh-requested";

export function requestMenuNotificationRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MENU_NOTIFICATION_REFRESH_EVENT));
  }
}
