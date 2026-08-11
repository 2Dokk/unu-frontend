import { Badge } from "@/components/ui/badge";
import {
  ACTIVITY_OPENING_STATUS_LABEL,
  ActivityOpeningRequestStatus,
} from "@/lib/interfaces/activity-opening-request";

export function ActivityOpeningStatusBadge({
  status,
}: {
  status: ActivityOpeningRequestStatus;
}) {
  if (status === "APPROVED") {
    return <Badge className="bg-emerald-700 text-white">승인</Badge>;
  }
  if (status === "REJECTED") {
    return <Badge variant="destructive">반려</Badge>;
  }
  if (status === "REVISION_REQUESTED") {
    return <Badge className="bg-amber-500 text-white">보완 요청</Badge>;
  }
  if (status === "CANCELED") {
    return <Badge variant="outline">취소</Badge>;
  }
  return <Badge variant="secondary">{ACTIVITY_OPENING_STATUS_LABEL[status]}</Badge>;
}
