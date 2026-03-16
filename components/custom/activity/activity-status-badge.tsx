import { Badge } from "@/components/ui/badge";

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  CREATED:   { label: "준비 중", variant: "outline" },
  OPEN:      { label: "모집 중", variant: "default" },
  ONGOING:   { label: "진행 중", variant: "secondary" },
  COMPLETED: { label: "종료",    variant: "destructive" },
};

interface ActivityStatusBadgeProps {
  status: string;
}

export function ActivityStatusBadge({ status }: ActivityStatusBadgeProps) {
  const meta = STATUS_META[status] ?? { label: status, variant: "outline" as const };

  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
