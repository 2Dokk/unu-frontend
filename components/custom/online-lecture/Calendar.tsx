"use client";

import { useState } from "react";
import {
  WEEKDAYS,
  fromDateStr,
  isReservableDate,
  maxReservationDateStr,
  toDateStr,
  todayStr,
} from "@/lib/online-lecture/date";

interface Props {
  /** "yyyy-MM-dd" */
  selected: string;
  onSelect: (date: string) => void;
}

export default function Calendar({ selected, onSelect }: Props) {
  const selDate = fromDateStr(selected);
  const [view, setView] = useState(() => new Date(selDate.getFullYear(), selDate.getMonth(), 1));

  const today = todayStr();
  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 이번 달이 '오늘이 있는 달'보다 이전이면 뒤로 못 간다
  const todayDate = fromDateStr(today);
  const maxDate = maxReservationDateStr(today);
  const maxDateObj = fromDateStr(maxDate);
  const atFirstMonth =
    year === todayDate.getFullYear() && month === todayDate.getMonth();
  const atLastMonth = year === maxDateObj.getFullYear() && month === maxDateObj.getMonth();

  const shift = (delta: number) => setView(new Date(year, month + delta, 1));

  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1))),
  ];

  return (
    <div className="rounded-[18px] border border-line bg-white px-6 py-[22px]">
      <div className="mb-[18px] flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-[-0.3px]">날짜 선택</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => shift(-1)}
            disabled={atFirstMonth}
            aria-label="이전 달"
            className={`h-[30px] w-[30px] rounded-[9px] border border-line bg-white text-[15px] ${
              atFirstMonth ? "cursor-not-allowed text-disabled" : "cursor-pointer text-hint hover:border-brand-line"
            }`}
          >
            ‹
          </button>
          <span className="min-w-[92px] text-center text-[15px] font-extrabold tracking-[-0.3px]">
            {year}년 {month + 1}월
          </span>
          <button
            onClick={() => shift(1)}
            disabled={atLastMonth}
            aria-label="다음 달"
            className={`h-[30px] w-[30px] rounded-[9px] border border-line bg-white text-[15px] ${
              atLastMonth ? "cursor-not-allowed text-disabled" : "cursor-pointer text-hint hover:border-brand-line"
            }`}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1.5 text-center text-[11.5px] font-bold ${
              i === 0 ? "text-sun" : i === 6 ? "text-brand" : "text-faint"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`pad-${i}`} className="h-10" />;

          const day = Number(dateStr.slice(-2));
          const selectable = isReservableDate(dateStr, today); // "yyyy-MM-dd"는 문자열 비교로 날짜 비교가 성립
          const isSelected = dateStr === selected;

          return (
            <button
              key={dateStr}
              disabled={!selectable}
              onClick={() => onSelect(dateStr)}
              className={`flex h-10 items-center justify-center rounded-[11px] border text-sm font-bold transition-colors ${
                isSelected
                  ? "cursor-pointer border-brand-dark bg-brand-dark text-white"
                  : selectable
                    ? "cursor-pointer border-line-soft bg-white text-ink hover:border-brand-line"
                    : "cursor-not-allowed border-transparent bg-transparent text-disabled-2"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
