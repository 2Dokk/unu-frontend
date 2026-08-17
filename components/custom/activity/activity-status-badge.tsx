import { Badge } from "@/components/ui/badge";
import { STATUS_TONES } from "@/lib/constants/status-badge-tones";

const STATUS_META: Record<string, { label: string; tone: string }> = {
  CREATED: { label: "준비 중", tone: STATUS_TONES.neutral },
  OPEN: { label: "모집 중", tone: STATUS_TONES.positive },
  ONGOING: { label: "진행 중", tone: STATUS_TONES.neutral },
  COMPLETED: { label: "종료", tone: STATUS_TONES.neutral },
};

interface ActivityStatusBadgeProps {
  status: string;
}

export function ActivityStatusBadge({ status }: ActivityStatusBadgeProps) {
  const meta = STATUS_META[status] ?? {
    label: status,
    tone: STATUS_TONES.neutral,
  };

  return (
    <Badge variant="outline" className={meta.tone}>
      {meta.label}
    </Badge>
  );
}
