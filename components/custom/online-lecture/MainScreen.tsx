"use client";

import type { Lecture, ReservationGroup } from "@/lib/online-lecture/types";
import { durationLabel, shortDateLabel, timeRangeLabel } from "@/lib/online-lecture/date";

interface Props {
  lectures: Lecture[];
  upcoming: ReservationGroup[];
  onOpenLecture: (lecture: Lecture) => void;
  onGoMy: () => void;
}

const RULES = [
  "신청한 강의만 예약할 수 있어요. 그 외 강의는 목록에서 확인만 가능합니다.",
  "강의당 일주일 최대 4시간까지 예약할 수 있어요.",
  "최대 연속 예약 가능 시간은 2시간까지입니다.",
  "오늘부터 3주 이내 날짜만 예약할 수 있어요.",
];

export default function MainScreen({ lectures, upcoming, onOpenLecture, onGoMy }: Props) {
  const previewReservations = upcoming.slice(0, 2);
  const hiddenDateCount = new Set(upcoming.slice(2).map((m) => m.res_date)).size;

  return (
    <main className="mx-auto max-w-[1160px] px-5 pt-11 pb-20 sm:px-7">
      <h2 className="mb-[18px] text-[19px] font-bold tracking-[-0.4px]">예약 가능한 강의</h2>

      <div className="grid grid-cols-1 items-start gap-[30px] lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 강의 목록 */}
        <section className="flex flex-col gap-[13px]">
          {lectures.length === 0 && (
            <div className="rounded-2xl border border-line bg-white px-[22px] py-8 text-center text-[13.5px] text-hint">
              등록된 강의가 없습니다.
            </div>
          )}

          {lectures.map((c) => {
            const locked = !c.enrolled;
            return (
              <div
                key={c.id}
                onClick={() => !locked && onOpenLecture(c)}
                className={`flex rounded-2xl border px-[22px] py-5 transition-all ${
                  locked
                    ? "cursor-default border-line-soft bg-surface-locked opacity-[0.72]"
                    : "cursor-pointer border-line bg-white hover:border-brand-line hover:shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-[9px] flex items-center gap-[9px]">
                    <span
                      className={`inline-flex items-center gap-[5px] rounded-full px-2.5 py-1 text-xs font-bold ${
                        locked
                          ? "bg-[#f2f3f6] text-faint"
                          : "bg-brand-soft text-brand-deep"
                      }`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          locked ? "bg-[#c2c7d1]" : "bg-[#22a75a]"
                        }`}
                      />
                      {locked ? "미신청" : "예약 가능"}
                    </span>
                    {c.category && (
                      <span className="rounded-md bg-line-soft px-1.5 py-0.5 text-[11px] font-bold text-ink-3">
                        {c.category}
                        </span>
                    )}
                    {c.level && (
                      <span className="rounded-md bg-line-soft px-1.5 py-0.5 text-[11px] font-bold text-ink-3">
                        {c.level}
                      </span>
                    )}
                  </div>

                  <h3 className="mb-1.5 text-[17px] font-bold tracking-[-0.4px] text-ink">
                    {c.name}
                  </h3>

                  {/* 목록에선 한 줄만. 전문은 상세 화면에서 보여준다 */}
                  {c.description && (
                    <p className="line-clamp-1 text-[13.5px] leading-normal text-hint">
                      {c.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end justify-end self-stretch pl-[18px]">
                  <span
                    className={`text-[13px] font-bold whitespace-nowrap ${
                      locked ? "text-[#8b93a3]" : "text-brand"
                    }`}
                  >
                    {locked ? "미신청" : "예약하러 가기 →"}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* 우측 레일 */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px]">
          <div className="rounded-2xl bg-brand-dark p-[22px] text-white">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold">내 예약</span>
              <button
                onClick={onGoMy}
                className="cursor-pointer text-xs font-semibold text-[#aeb9e6] hover:text-white"
              >
                전체 보기 →
              </button>
            </div>

            {upcoming.length === 0 ? (
              <p className="border-t border-white/10 pt-3 text-[12.5px] text-white/60">
                예정된 예약이 없습니다.
              </p>
            ) : (
              <>
                {previewReservations.map((m) => (
                  <div
                    key={m.key}
                    className="flex items-center gap-3 border-t border-white/10 py-[11px]"
                  >
                    <div className="min-w-[42px] text-center">
                      <div className="text-[11px] font-semibold text-[#ffffff]">
                        {shortDateLabel(m.res_date)}
                      </div>
                      <div className="text-[15px] font-extrabold tracking-[-0.3px]">
                        {m.times[0]}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold">{m.lecture}</div>
                      <div className="mt-0.5 text-[11px] font-bold text-[#ffffff]">
                        {timeRangeLabel(m.times)} · {durationLabel(m.times.length)}
                      </div>
                    </div>
                  </div>
                ))}
                {hiddenDateCount > 0 && (
                  <p className="border-t border-white/10 pt-3 text-[12.5px] font-bold text-[#b9e0c2]">
                    그 외 {hiddenDateCount}개 날짜의 예약이 더 있어요
                  </p>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-white p-[22px]">
            <div className="mb-3.5 flex items-center gap-2">
              <span className="text-[15px]">📌</span>
              <span className="text-sm font-bold">예약 안내</span>
            </div>
            <ul className="flex list-none flex-col gap-[11px] p-0">
              {RULES.map((r) => (
                <li key={r} className="flex gap-[9px] text-[12.8px] leading-normal text-ink-3">
                  <span className="shrink-0 font-extrabold text-brand">·</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
