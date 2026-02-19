import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "CREATED", label: "생성됨" },
  { value: "OPEN", label: "모집중" },
  { value: "ONGOING", label: "진행중" },
  { value: "COMPLETED", label: "완료됨" },
];

interface ActivityStatusDropdownProps {
  activityId: number;
  currentStatus: string;
  onStatusChange: (activityId: number, newStatus: string) => void;
  isUpdating: boolean;
}

const ActivityStatusDropdown = ({
  activityId,
  currentStatus,
  onStatusChange,
  isUpdating,
}: ActivityStatusDropdownProps) => {
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
        {STATUS_OPTIONS.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onStatusChange(activityId, value)}
            disabled={currentStatus === value}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActivityStatusDropdown;
