import { Badge } from "@/components/ui/badge";
import { STATUS_TONES } from "@/lib/constants/status-badge-tones";
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
    return (
      <Badge variant="outline" className={STATUS_TONES.positive}>
        승인
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge variant="outline" className={STATUS_TONES.negative}>
        반려
      </Badge>
    );
  }
  if (status === "REVISION_REQUESTED") {
    return (
      <Badge variant="outline" className={STATUS_TONES.pending}>
        보완 요청
      </Badge>
    );
  }
  if (status === "CANCELED") {
    return (
      <Badge variant="outline" className={STATUS_TONES.neutral}>
        취소
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={STATUS_TONES.neutral}>
      {ACTIVITY_OPENING_STATUS_LABEL[status]}
    </Badge>
  );
}
