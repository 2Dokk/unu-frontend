"use client";

import type { ReactNode } from "react";
import type { Booking } from "@/lib/online-lecture/types";
import { dateLabel, durationLabel, timeRangeLabel } from "@/lib/online-lecture/date";

interface Props {
  booking: Booking;
  onGoMain: () => void;
  onGoMy: () => void;
}

export default function ConfirmScreen({ booking, onGoMain, onGoMy }: Props) {
  const items = booking.items ?? [booking];
  const hasAdditions = items.some((item) => item.addTimes.length > 0);
  const hasRemovals = items.some((item) => item.removeTimes.length > 0);
  const title = hasAdditions
    ? hasRemovals
      ? "예약이 변경되었습니다"
      : "예약이 완료되었습니다"
    : "예약이 취소되었습니다";
  const statusLabel = hasAdditions ? (hasRemovals ? "변경 완료" : "예약 완료") : "취소 완료";
  const description = hasAdditions ? (
    <>
      예약 시간에 맞춰 강의를 이용해 주세요. <br />계정 정보를 확인해 주세요. 내 예약 페이지에서도 확인하실 수 있습니다.
    </>
  ) : (
    "선택한 예약이 취소되었습니다. 내 예약 페이지에서 남은 예약을 확인할 수 있습니다."
  );

  const changeLabel = (item: typeof items[number]): ReactNode => {
    if (item.addTimes.length === 0 && item.removeTimes.length === 0) return "변동사항 없음";

    return (
      <span className="flex flex-col gap-1">
        {item.addTimes.length > 0 && (
          <span className="text-brand-dark">+ {timeRangeLabel(item.addTimes)} 추가</span>
        )}
        {item.removeTimes.length > 0 && (
          <span className="text-danger">− {timeRangeLabel(item.removeTimes)} 취소</span>
        )}
      </span>
    );
  };

  const accountRowsFor = (item: typeof items[number]): { k: string; v: ReactNode }[] =>
    item.account
        ? [
            ...(item.account.course_url
              ? [
                  {
                    k: "수강 사이트",
                    v: (
                      <a
                        href={item.account.course_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-md bg-brand-dark px-2.5 py-1 text-[12px] leading-none font-bold text-white hover:bg-brand"
                      >
                        열기
                      </a>
                    ),
                  },
                ]
              : []),
            { k: "계정 Email", v: item.account.login_id },
            { k: "비밀번호", v: item.account.login_password },
          ]
        : item.accountError
          ? [{ k: "계정 정보", v: item.accountError }]
          : [{ k: "계정 정보", v: "등록된 계정 정보가 없습니다." }];

  const accountItems = Array.from(
    items
      .filter((item) => item.addTimes.length > 0)
      .reduce((byLecture, item) => {
        const current = byLecture.get(item.lecture);
        if (!current || (!current.account && item.account)) {
          byLecture.set(item.lecture, item);
        }
        return byLecture;
      }, new Map<string, (typeof items)[number]>())
      .values(),
  );

  const rowsFor = (item: typeof items[number]): { k: string; v: ReactNode }[] => {
    const showFullDetails = item.addTimes.length > 0;

    return [
      { k: "강의", v: item.lecture },
      { k: "날짜", v: dateLabel(item.date) },
      ...(showFullDetails
        ? [{ k: "최종 예약 시간", v: timeRangeLabel(item.finalTimes) }]
        : []),
      { k: "변동사항", v: changeLabel(item) },
      ...(showFullDetails
        ? [{ k: "총 예약 시간", v: durationLabel(item.finalTimes.length) }]
        : []),
    ];
  };

  return (
    <main className="mx-auto max-w-[520px] px-5 pt-[70px] pb-20 text-center sm:px-7">
      <div className="mx-auto mb-[22px] flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#e8f6ee] text-[32px] text-brand-deep">
        ✓
      </div>
      <h1 className="mb-2.5 text-[26px] font-extrabold tracking-[-0.7px]">
        {title}
      </h1>
      <p className="mb-8 text-[14.5px] leading-relaxed text-hint">
        {description}
      </p>

      <div className="mb-[26px] rounded-[18px] border border-line bg-white px-7 py-[26px] text-left">
        <div className="mb-[18px] flex items-center gap-[9px] border-b border-line-divider pb-[18px]">
          <span className="inline-flex items-center gap-[5px] rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
            {statusLabel}
          </span>
        </div>
        {items.map((item, index) => (
          <div
            key={`${item.lecture}-${item.date}-${index}`}
            className={index > 0 ? "border-t border-line-divider pt-4" : ""}
          >
            {items.length > 1 && (
              <div className="mb-2 text-[13px] font-extrabold text-brand-dark">
                예약 {index + 1}
              </div>
            )}
            {rowsFor(item).map((row) => (
              <div key={row.k} className="flex items-start justify-between gap-5 py-[9px]">
                <span className="text-[13.5px] font-medium text-hint">{row.k}</span>
                <span className="max-w-[270px] break-all text-right text-sm font-bold whitespace-pre-line text-ink">
                  {row.v}
                </span>
              </div>
            ))}
          </div>
        ))}
        {accountItems.length > 0 && (
          <div className="mt-4 border-t border-line-divider pt-5">
            <div className="mb-3 text-[13px] font-extrabold text-brand-dark">
              수강 정보
            </div>
            {accountItems.map((item, index) => (
              <div
                key={item.lecture}
                className={index > 0 ? "mt-4 border-t border-line-divider pt-4" : ""}
              >
                {accountItems.length > 1 && (
                  <div className="mb-1 text-[13px] font-bold text-ink">
                    {item.lecture}
                  </div>
                )}
                {accountRowsFor(item).map((row) => (
                  <div key={row.k} className="flex items-start justify-between gap-5 py-[9px]">
                    <span className="text-[13.5px] font-medium text-hint">{row.k}</span>
                    <span className="max-w-[270px] break-all text-right text-sm font-bold whitespace-pre-line text-ink">
                      {row.v}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-[11px]">
        <button
          onClick={onGoMain}
          className="flex-1 cursor-pointer rounded-xl border border-line-input bg-white p-[15px] text-[14.5px] font-bold text-ink-2 hover:border-brand-line"
        >
          다른 강의 예약
        </button>
        <button
          onClick={onGoMy}
          className="flex-1 cursor-pointer rounded-xl bg-brand-dark p-[15px] text-[14.5px] font-bold text-white hover:bg-brand"
        >
          내 예약 보기
        </button>
      </div>
    </main>
  );
}
