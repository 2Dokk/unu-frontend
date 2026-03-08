import { Badge } from "@/components/ui/badge";
import { ActivityTypeResponse } from "@/lib/interfaces/activity";

const TYPE_CLASS: Record<string, string> = {
  STUDY: "bg-blue-50 text-blue-700 border-blue-200",
  PROJECT: "bg-violet-50 text-violet-700 border-violet-200",
  ONLINE_COURSE: "bg-amber-50 text-amber-700 border-amber-200",
};

interface ActivityTypeBadgeProps {
  activityType: ActivityTypeResponse;
}

export function ActivityTypeBadge({ activityType }: ActivityTypeBadgeProps) {
  return (
    <Badge variant="outline" className={TYPE_CLASS[activityType.code]}>
      {activityType.name}
    </Badge>
  );
}
