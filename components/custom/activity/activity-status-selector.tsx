import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "CREATED", label: "생성됨" },
  { value: "OPEN", label: "모집중" },
  { value: "ONGOING", label: "진행중" },
  { value: "COMPLETED", label: "완료됨" },
];

interface ActivityStatusSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function ActivityStatusSelector({
  value,
  onChange,
  placeholder = "상태 선택",
}: ActivityStatusSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-45">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
