import { Badge } from "@/components/ui/badge";

interface ParticipantStatusBadgeProps {
  status: string;
}

export function ParticipantStatusBadge({ status }: ParticipantStatusBadgeProps) {
  switch (status) {
    case "APPLIED":
      return <Badge variant="secondary">신청 완료</Badge>;
    case "APPROVED":
      return <Badge>참여 확정</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">신청 반려</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
