import type { Reservation, ReservationGroup } from "./types";
import { compareTimes, minutesOf, SLOT_MINUTES, todayStr } from "./date";

/** 예약 행들을 (날짜, 강의)로 묶는다. times와 ids는 같은 순서로 정렬된다. */
export function groupReservations(rows: Reservation[]): ReservationGroup[] {
  const map = new Map<string, { lecture: string; res_date: string; items: { time: string; id: number }[] }>();

  for (const r of rows) {
    const key = `${r.res_date}::${r.lecture}`;
    const g = map.get(key) ?? { lecture: r.lecture, res_date: r.res_date, items: [] };
    g.items.push({ time: r.res_time, id: r.id });
    map.set(key, g);
  }

  return [...map.entries()]
    .map(([key, g]) => {
      const sorted = [...g.items].sort((a, b) => compareTimes(a.time, b.time));
      return {
        key,
        lecture: g.lecture,
        res_date: g.res_date,
        times: sorted.map((i) => i.time),
        ids: sorted.map((i) => i.id),
      };
    })
    .sort(
      (a, b) =>
        a.res_date.localeCompare(b.res_date) || compareTimes(a.times[0], b.times[0]),
    );
}

/**
아직 끝나지 않은 예약인지. 오늘이면 시간까지 따진다
 */
export function isUpcoming(g: ReservationGroup): boolean {
  const today = todayStr();
  if (g.res_date > today) return true;
  if (g.res_date < today) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const lastEndMinutes = Math.max(...g.times.map((time) => minutesOf(time) + SLOT_MINUTES));
  return lastEndMinutes > nowMinutes;
}

export function splitByTime(groups: ReservationGroup[]): {
  upcoming: ReservationGroup[];
  past: ReservationGroup[];
} {
  const upcoming: ReservationGroup[] = [];
  const past: ReservationGroup[] = [];
  for (const g of groups) (isUpcoming(g) ? upcoming : past).push(g);
  return { upcoming, past: past.reverse() };
}
