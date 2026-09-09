import type { QuarterResponse } from "@/lib/interfaces/quarter";

const SEASON_ORDER: Record<string, number> = {
  WINTER: 0,
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
};

export function getQuarterSequence(quarter: QuarterResponse): number {
  return quarter.year * 10 + (SEASON_ORDER[quarter.season.toUpperCase()] ?? 4);
}

/** 목록 표시용: 최근 연도가 위로, 같은 연도 안에서는 FALL → SUMMER → SPRING → WINTER 순. */
export function compareQuartersForDisplay(
  a: QuarterResponse,
  b: QuarterResponse,
): number {
  return b.year - a.year || getQuarterSequence(b) - getQuarterSequence(a);
}

export function compareQuartersChronologically(
  a: QuarterResponse,
  b: QuarterResponse,
): number {
  return getQuarterSequence(a) - getQuarterSequence(b);
}
