export function formatUnreadCount(count: number): number | "9+" {
  return count >= 9 ? "9+" : count;
}
