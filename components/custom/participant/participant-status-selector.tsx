import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "APPLIED", label: "신청 완료" },
  { value: "APPROVED", label: "참여 확정" },
  { value: "REJECTED", label: "신청 반려" },
];

interface ParticipantStatusSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  appliedLabel?: string;
}

export function ParticipantStatusSelector({
  value,
  onChange,
  placeholder = "상태 선택",
  disabled = false,
  appliedLabel = "신청 완료",
}: ParticipantStatusSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-24 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem
            key={status.value}
            value={status.value}
            className="text-xs"
          >
            {status.value === "APPLIED" ? appliedLabel : status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
