import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { Loader2 } from "lucide-react";

interface ApplicationStatusDropdownProps {
  applicationId: string;
  currentStatus: string;
  onStatusChange: (applicationId: string, newStatus: string) => void;
  isUpdating: boolean;
  /** true면 PASSED/REJECTED를 "승인/미승인"으로 표시한다(학회 내부 신청/모집용). */
  useApprovalLabels?: boolean;
}

const ApplicationStatusDropdown = ({
  applicationId,
  currentStatus,
  onStatusChange,
  isUpdating,
  useApprovalLabels = false,
}: ApplicationStatusDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              처리중
            </>
          ) : (
            "상태 변경"
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onStatusChange(applicationId, "APPLIED")}
          disabled={currentStatus === "APPLIED"}
        >
          신청
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(applicationId, "IN_PROGRESS")}
          disabled={currentStatus === "IN_PROGRESS"}
        >
          검토중
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(applicationId, "WAITING")}
          disabled={currentStatus === "WAITING"}
        >
          대기
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(applicationId, "HOLD")}
          disabled={currentStatus === "HOLD"}
        >
          보류
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(applicationId, "PASSED")}
          disabled={currentStatus === "PASSED"}
        >
          {useApprovalLabels ? "승인" : "합격"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(applicationId, "REJECTED")}
          disabled={currentStatus === "REJECTED"}
        >
          {useApprovalLabels ? "미승인" : "불합격"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(applicationId, "CANCELED")}
          disabled={currentStatus === "CANCELED"}
        >
          취소
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ApplicationStatusDropdown;
