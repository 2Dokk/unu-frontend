export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
export const RESERVATION_WINDOW_DAYS = 21;
export const SLOT_MINUTES = 30;

/** 00:00 ~ 23:30 */
export const TIME_SLOTS = Array.from(
  { length: (24 * 60) / SLOT_MINUTES },
  (_, i) => formatMinutes(i * SLOT_MINUTES),
);

/** Date → "yyyy-MM-dd" (로컬 기준. toISOString은 UTC로 밀려서 쓰지 않는다) */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "yyyy-MM-dd" → Date (로컬 자정) */
export function fromDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}


export function dateLabel(s: string): string {
  const d = fromDateStr(s);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

export function shortDateLabel(s: string): string {
  const d = fromDateStr(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function addDaysToDateStr(s: string, days: number): string {
  const d = fromDateStr(s);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function maxReservationDateStr(today = todayStr()): string {
  return addDaysToDateStr(today, RESERVATION_WINDOW_DAYS);
}

export function isReservableDate(date: string, today = todayStr()): boolean {
  return date >= today && date <= maxReservationDateStr(today);
}

/** "14:00" → 14 */
export function hourOf(time: string): number {
  return Number(time.split(":")[0]);
}

/** "14:30" → 870 */
export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatMinutes(minutes: number): string {
  if (minutes === 24 * 60) return "24:00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function compareTimes(a: string, b: string): number {
  return minutesOf(a) - minutesOf(b);
}

export function slotCountToHours(slotCount: number): number {
  return (slotCount * SLOT_MINUTES) / 60;
}

export function durationLabel(slotCount: number): string {
  const minutes = slotCount * SLOT_MINUTES;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
}

export function timePointLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return m === 0 ? `${h}시` : `${h}시 ${m}분`;
}

export function maxContinuous(times: string[]): number {
  if (times.length === 0) return 0;
  const slots = [...new Set(times.map(minutesOf))].sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < slots.length; i++) {
    if (slots[i] === slots[i - 1] + SLOT_MINUTES) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function timeRangeLabel(times: string[]): string {
  if (times.length === 0) return "";
  const slots = [...new Set(times.map(minutesOf))].sort((a, b) => a - b);

  const ranges: string[] = [];
  let start = slots[0];
  let end = slots[0] + SLOT_MINUTES;

  for (let i = 1; i < slots.length; i++) {
    if (slots[i] === end) {
      end += SLOT_MINUTES;
      continue;
    }

    ranges.push(`${formatMinutes(start)}–${formatMinutes(end)}`);
    start = slots[i];
    end = slots[i] + SLOT_MINUTES;
  }

  ranges.push(`${formatMinutes(start)}–${formatMinutes(end)}`);
  return ranges.join(", ");
}

export function weekStartStr(date: string): string {
  const d = fromDateStr(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

export function isSameWeek(a: string, b: string): boolean {
  return weekStartStr(a) === weekStartStr(b);
}

export function weekOfMonthLabel(weekStart: string): string {
  const monday = fromDateStr(weekStart);
  const month = monday.getMonth() + 1;
  const firstOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const firstWeekday = firstOfMonth.getDay();
  const firstMondayOffset = firstWeekday === 0 ? -6 : 1 - firstWeekday;
  const firstWeekMonday = new Date(monday.getFullYear(), monday.getMonth(), 1 + firstMondayOffset);
  const weekIndex = Math.round((monday.getTime() - firstWeekMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  const weekEnd = addDaysToDateStr(weekStart, 6);
  return `${month}월 ${weekIndex}주차 (${shortMonthDayLabel(weekStart)} ~ ${shortMonthDayLabel(weekEnd)})`;
}

function shortMonthDayLabel(s: string): string {
  const d = fromDateStr(s);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
