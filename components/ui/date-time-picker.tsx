"use client";

import * as React from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "날짜를 선택하세요",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const date = value ? new Date(value) : undefined;
  const hour = date ? date.getHours().toString().padStart(2, "0") : "00";
  const minute = date
    ? Math.floor(date.getMinutes() / 5) * 5 === date.getMinutes()
      ? date.getMinutes().toString().padStart(2, "0")
      : date.getMinutes().toString().padStart(2, "0")
    : "00";

  function toInputString(d: Date): string {
    const y = d.getFullYear();
    const mo = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const h = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    return `${y}-${mo}-${day}T${h}:${min}`;
  }

  function handleDateSelect(selected: Date | undefined) {
    if (!selected) return;
    const base = date ? new Date(date) : new Date();
    selected.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(toInputString(selected));
  }

  function handleHourChange(h: string) {
    const base = date ? new Date(date) : new Date();
    base.setHours(parseInt(h), base.getMinutes(), 0, 0);
    onChange(toInputString(base));
  }

  function handleMinuteChange(m: string) {
    const base = date ? new Date(date) : new Date();
    base.setMinutes(parseInt(m), 0, 0);
    onChange(toInputString(base));
  }

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const minutes = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, "0"),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          autoFocus
        />
        <div className="border-t p-3 flex flex-1 items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={hour} onValueChange={handleHourChange}>
            <SelectTrigger className="w-21 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}시
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">:</span>
          <Select value={minute} onValueChange={handleMinuteChange}>
            <SelectTrigger className="w-21 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}분
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
