"use client";

import { useMemo, useState } from "react";
import type { LectureAccountStatus, ReservationGroup } from "@/lib/online-lecture/types";
import { compareTimes, dateLabel, durationLabel, timePointLabel, timeRangeLabel } from "@/lib/online-lecture/date";

interface Props {
  upcoming: ReservationGroup[];
  past: ReservationGroup[];
  accountByLecture: Record<string, LectureAccountStatus>;
  loading: boolean;
  onCancel: (ids: number[], confirmMessage: string) => Promise<boolean>;
  onGoMain: () => void;
}

interface LectureReservationGroup {
  lecture: string;
  groups: ReservationGroup[];
  totalSlots: number;
}

function groupByLecture(groups: ReservationGroup[]): LectureReservationGroup[] {
  const map = new Map<string, ReservationGroup[]>();

  for (const group of groups) {
    const lectureGroups = map.get(group.lecture) ?? [];
    lectureGroups.push(group);
    map.set(group.lecture, lectureGroups);
  }

  return [...map.entries()].map(([lecture, lectureGroups]) => ({
    lecture,
    groups: lectureGroups,
    totalSlots: lectureGroups.reduce((sum, group) => sum + group.times.length, 0),
  }));
}

function compactDateLabel(date: string): string {
  return dateLabel(date).replace(/\s*\(.\)$/, "");
}

function selectedCancelMessage(groups: ReservationGroup[], ids: number[]): string {
  const selected = new Set(ids);
  const targets = groups
    .map((group) => {
      const times = group.times
        .filter((_, index) => selected.has(group.ids[index]))
        .sort(compareTimes);

      return { date: compactDateLabel(group.res_date), times };
    })
    .filter((target) => target.times.length > 0);

  if (targets.length === 1) {
    const target = targets[0];
    return `${target.date}의 ${target.times.map(timePointLabel).join(", ")} 예약을 취소하시겠습니까?`;
  }

  return [
    "선택한 예약을 취소하시겠습니까?",
    ...targets.map(
      (target) => `${target.date}: ${target.times.map(timePointLabel).join(", ")}`,
    ),
  ].join("\n");
}

export default function MyScreen({
  upcoming,
  past,
  accountByLecture,
  loading,
  onCancel,
  onGoMain,
}: Props) {
  // 시간 단위로 취소 대상을 고른 뒤, 카드 상단에서 한 번에 취소한다.
  const [checked, setChecked] = useState<number[]>([]);
  const upcomingByLecture = useMemo(() => groupByLecture(upcoming), [upcoming]);
  const pastByLecture = useMemo(() => groupByLecture(past), [past]);

  const toggle = (id: number) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleGroup = (g: ReservationGroup) => {
    setChecked((prev) => {
      const selected = new Set(prev);
      const allSelected = g.ids.every((id) => selected.has(id));

      if (allSelected) {
        return prev.filter((id) => !g.ids.includes(id));
      }

      for (const id of g.ids) selected.add(id);
      return [...selected];
    });
  };

  const cancelIds = async (ids: number[], confirmMessage: string) => {
    if (ids.length === 0) return;
    const didCancel = await onCancel(ids, confirmMessage);
    if (didCancel) setChecked((prev) => prev.filter((id) => !ids.includes(id)));
  };

  return (
    <main className="mx-auto max-w-[780px] px-5 pt-11 pb-20 sm:px-7">
      <button
        onClick={onGoMain}
        className="mb-2 inline-flex cursor-pointer items-center gap-1.5 py-2 text-[13.5px] font-semibold text-hint hover:text-ink-2"
      >
        ← 강의 예약으로
      </button>
      <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.8px]">내 예약</h1>
      <p className="mb-[30px] text-[14.5px] text-hint">
        예정된 예약과 지난 이용 내역을 확인할 수 있어요.
      </p>

      <h2 className="mb-3.5 text-sm font-bold tracking-[-0.2px] text-hint">예정된 예약</h2>
      <div className="mb-9 flex flex-col gap-[13px]">
        {upcoming.length === 0 && (
          <div className="rounded-2xl border border-line bg-white px-[22px] py-8 text-center text-[13.5px] text-hint">
            예정된 예약이 없습니다.
          </div>
        )}

        {upcomingByLecture.map((lectureGroup) => {
          const lectureIds = lectureGroup.groups.flatMap((group) => group.ids);
          const lecturePickedIds = lectureIds.filter((id) => checked.includes(id));

          return (
            <section
              key={lectureGroup.lecture}
              className="rounded-2xl border border-line bg-white px-[22px] py-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5">
                    <span className="inline-flex items-center gap-[5px] rounded-full bg-brand-soft px-[9px] py-[3px] text-[11.5px] font-bold text-brand">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
                      예약 완료
                    </span>
                  </div>
                  <h3 className="break-words text-[17px] leading-snug font-extrabold tracking-[-0.4px] text-ink">
                    {lectureGroup.lecture}
                  </h3>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[18px] font-extrabold tracking-[-0.4px] text-brand-dark">
                    {durationLabel(lectureGroup.totalSlots)}
                  </div>
                  <div className="text-[11.5px] font-semibold text-faint">
                    {lectureGroup.groups.length}개 날짜
                  </div>
                  <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                    <button
                      onClick={() =>
                        void cancelIds(
                          lecturePickedIds,
                          selectedCancelMessage(lectureGroup.groups, lecturePickedIds),
                        )
                      }
                      disabled={loading || lecturePickedIds.length === 0}
                      className="cursor-pointer rounded-[9px] border border-line-input bg-white px-2.5 py-1.5 text-[11.5px] font-bold whitespace-nowrap text-ink-3 hover:border-danger-line hover:text-danger disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      선택한 시간 취소
                    </button>
                    <button
                      onClick={() =>
                        void cancelIds(lectureIds, "이 강의의 모든 예약을 취소하시겠습니까?")
                      }
                      disabled={loading}
                      className="cursor-pointer rounded-[9px] border border-danger-line bg-danger-soft px-2.5 py-1.5 text-[11.5px] font-bold whitespace-nowrap text-danger disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      전체 예약 취소
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                const accountInfo = accountByLecture[lectureGroup.lecture];
                if (!accountInfo) return null;

                return (
                  <div className="mb-4 rounded-xl border border-line-soft bg-surface-sunken px-4 py-3">
                    <div className="mb-2 text-[12px] font-bold text-hint">계정 정보</div>
                    {accountInfo.account ? (
                      <div className="flex flex-col gap-1.5 text-[12.5px]">
                        {accountInfo.account.course_url && (
                          <div className="flex items-start justify-between gap-4">
                            <span className="font-medium text-faint">수강 사이트</span>
                            <a
                              href={accountInfo.account.course_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-md bg-brand-dark px-2.5 py-1 text-[12px] leading-none font-bold text-white hover:bg-brand"
                            >
                              열기
                            </a>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <span className="font-medium text-faint">계정 Email</span>
                          <span className="break-all text-right font-bold text-ink">
                            {accountInfo.account.login_id}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span className="font-medium text-faint">비밀번호</span>
                          <span className="break-all text-right font-bold text-ink">
                            {accountInfo.account.login_password}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[12.5px] font-semibold text-faint">
                        {accountInfo.error ?? "등록된 계정 정보가 없습니다."}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="border-t border-line-divider pt-3">
                <div className="mb-1 text-[11.5px] font-semibold text-faint">
                  취소할 시간대를 선택하세요.
                </div>
                {lectureGroup.groups.map((g) => {
                  const pickedCount = g.ids.filter((id) => checked.includes(id)).length;
                  const allPicked = pickedCount === g.ids.length;
                  return (
                    <div key={g.key} className="py-4 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-[13px] font-bold text-ink-2">
                            {compactDateLabel(g.res_date)}
                          </div>
                          <div className="text-[12.5px] font-semibold text-faint">
                            {timeRangeLabel(g.times)} · {durationLabel(g.times.length)}
                          </div>
                        </div>

                        <button
                          onClick={() => toggleGroup(g)}
                          disabled={loading}
                          className={`cursor-pointer rounded-[10px] border px-3 py-[9px] text-[12.5px] font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 ${
                            allPicked
                              ? "border-danger-line bg-danger-soft text-danger"
                              : "border-line-input bg-white text-ink-3 hover:border-brand-line"
                          }`}
                        >
                          {allPicked ? "선택 해제" : "전체 선택"}
                        </button>
                      </div>

                      {/* 시간 단위 선택 — 일부만 취소하고 싶을 때 */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {g.times.map((t, i) => {
                          const id = g.ids[i];
                          const on = checked.includes(id);
                          return (
                            <button
                              key={id}
                              onClick={() => toggle(id)}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                                on
                                  ? "border-danger-line bg-danger-soft text-danger"
                                  : "border-line-soft bg-surface-sunken text-ink-3 hover:border-line-input"
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <h2 className="mb-3.5 text-sm font-bold tracking-[-0.2px] text-hint">지난 이용 내역</h2>
      <div className="flex flex-col gap-2.5">
        {past.length === 0 && (
          <div className="rounded-[14px] border border-line-soft bg-white px-5 py-6 text-center text-[13px] text-faint">
            아직 지난 내역이 없습니다.
          </div>
        )}

        {pastByLecture.map((lectureGroup) => (
          <div
            key={lectureGroup.lecture}
            className="rounded-[14px] border border-line-soft bg-white px-5 py-[15px] opacity-85"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[14.5px] font-semibold text-ink-2">
                {lectureGroup.lecture}
              </span>
              <span className="rounded-full bg-[#f2f3f6] px-2.5 py-1 text-xs font-bold whitespace-nowrap text-faint">
                이용 완료
              </span>
            </div>
            <div className="flex flex-col gap-1.5 border-t border-line-divider pt-2.5">
              {lectureGroup.groups.map((g) => (
                <div key={g.key} className="text-[12.5px] font-semibold text-faint">
                  {compactDateLabel(g.res_date)} · {timeRangeLabel(g.times)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
