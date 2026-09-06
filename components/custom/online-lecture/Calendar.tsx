"use client";

import { Calendar as SharedCalendar } from "@/components/ui/calendar";
import {
  fromDateStr,
  isReservableDate,
  maxReservationDateStr,
  toDateStr,
  todayStr,
} from "@/lib/online-lecture/date";

interface Props {
  selected: string;
  onSelect: (date: string) => void;
}

export default function Calendar({ selected, onSelect }: Props) {
  const today = todayStr();
  return (
    <section className="rounded-lg border border-line bg-white p-3">
      <h2 className="px-3 pt-2 text-sm font-semibold">날짜 선택</h2>
      <SharedCalendar
        className="mx-auto w-full"
        mode="single"
        selected={fromDateStr(selected)}
        defaultMonth={fromDateStr(selected)}
        startMonth={fromDateStr(today)}
        endMonth={fromDateStr(maxReservationDateStr(today))}
        disabled={(day) => !isReservableDate(toDateStr(day), today)}
        onSelect={(day) => { if (day) onSelect(toDateStr(day)); }}
      />
    </section>
  );
}
