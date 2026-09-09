import { Badge } from "@/components/ui/badge";
import { STATUS_TONES } from "@/lib/constants/status-badge-tones";

interface ParticipantStatusBadgeProps {
  status: string;
}

export function ParticipantStatusBadge({ status }: ParticipantStatusBadgeProps) {
  switch (status) {
    case "APPLIED":
      return (
        <Badge variant="outline" className={STATUS_TONES.neutral}>
          신청 완료
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="outline" className={STATUS_TONES.positive}>
          참여 확정
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="outline" className={STATUS_TONES.negative}>
          신청 반려
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={STATUS_TONES.neutral}>
          {status}
        </Badge>
      );
  }
}
