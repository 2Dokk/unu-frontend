import { Bell } from "lucide-react";

import { formatUnreadCount } from "@/lib/utils/unread-count";

export function ActivityNoticeUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
      <Bell className="h-3 w-3" />
      새 공지 {formatUnreadCount(count)}
    </span>
  );
}
