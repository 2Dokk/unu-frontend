"use client";

import type { Lecture, ReservationCartItem, ReservationGroup } from "@/lib/online-lecture/types";
import { TIME_SLOTS, dateLabel, durationLabel, minutesOf, shortDateLabel, timeRangeLabel, todayStr } from "@/lib/online-lecture/date";
import Calendar from "./Calendar";

interface Props {
  lecture: Lecture;
  selectedDate: string;
  desiredTimes: string[];
  reservedTimes: string[];
  myTimes: string[];
  /** 같은 날짜에 다른 강의로 이미 잡혀 있거나 예약 목록에 담긴 시간 */
  otherLectureBusyTimes: string[];

  toAdd: string[];
  toRemove: string[];

  cartItems: ReservationCartItem[];
  windowReservations: ReservationGroup[];
  weeklyRemaining: { weekStart: string; label: string; remaining: number }[];
  loading: boolean;
  onSelectDate: (date: string) => void;
  onToggleTime: (time: string) => void;
  onAddToCart: () => void;
  onRemoveCartItem: (key: string) => void;
  onSubmitCart: () => void;
  onBack: () => void;
}

function sameTimes(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((time, index) => time === right[index]);
}

export default function DetailScreen({
  lecture,
  selectedDate,
  desiredTimes,
  reservedTimes,
  myTimes,
  otherLectureBusyTimes,
  toAdd,
  toRemove,
  cartItems,
  windowReservations,
  weeklyRemaining,
  loading,
  onSelectDate,
  onToggleTime,
  onAddToCart,
  onRemoveCartItem,
  onSubmitCart,
  onBack,
}: Props) {
  const isToday = selectedDate === todayStr();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isDirty = toAdd.length > 0 || toRemove.length > 0;
  const cartListLabel =
    toRemove.length > 0 || cartItems.some((item) => item.removeTimes.length > 0)
      ? "변경 목록"
      : "예약 목록";
  const currentCartItem =
    cartItems.find((item) => item.lecture === lecture.name && item.date === selectedDate) ?? null;
  const selectionMatchesServer = sameTimes(desiredTimes, myTimes);
  const selectionMatchesCart = !!currentCartItem && sameTimes(desiredTimes, currentCartItem.times);
  const shouldRemoveCurrentCart =
    !!currentCartItem && selectionMatchesServer && !selectionMatchesCart;
  const hasPendingSelection =
    shouldRemoveCurrentCart || (!currentCartItem && !selectionMatchesServer) || (!!currentCartItem && !selectionMatchesCart);
  const canSubmitCart = cartItems.length > 0 && !loading;
  const canPutSelection = hasPendingSelection && !loading;
  const canPrimary = (canPutSelection || canSubmitCart) && !loading;
  const primaryLabel = loading
    ? "처리 중…"
    : canPutSelection
      ? shouldRemoveCurrentCart
        ? `${cartListLabel}에서 제거`
        : currentCartItem
        ? `${cartListLabel}에 반영`
        : `${cartListLabel}에 담기`
      : `${cartListLabel} 확정`;

  const handlePrimary = () => {
    if (shouldRemoveCurrentCart && currentCartItem) {
      onRemoveCartItem(currentCartItem.key);
      return;
    }
    if (canPutSelection) {
      onAddToCart();
      return;
    }
    onSubmitCart();
  };

  return (
    <main className="relative mx-auto max-w-[900px] px-5 pt-7 pb-20 sm:px-7">
      <div className="hidden 2xl:block 2xl:h-0 2xl:w-0 2xl:z-10">
        <div className="absolute top-[247px] right-[calc(50%+450px)] w-[260px] max-h-[calc(100vh-170px)] overflow-y-auto rounded-[18px] border border-line bg-white p-5">
          {/* <h2 className="mb-3 text-sm font-bold tracking-[-0.3px]">{lecture.name} · 주차별 남은 시간</h2>
          <div className="mb-4 flex flex-col gap-1.5 border-b border-line-divider pb-4">
            {weeklyRemaining.map((w) => (
              <div key={w.weekStart} className="flex flex-col gap-0.5 text-[12.5px] font-semibold">
                <span className="text-faint">{w.label}</span>
                <span className={w.remaining > 0 ? "text-brand-dark" : "text-disabled"}>
                  {w.remaining > 0 ? `${durationLabel(w.remaining)} 남음` : "다 채웠어요"}
                </span>
              </div>
            ))}
          </div> */}

          <h2 className="mb-3 text-sm font-bold tracking-[-0.3px]">전체 예약 현황</h2>
          {windowReservations.length === 0 ? (
            <p className="text-[12.5px] text-faint">예약 가능 기간 내 예약이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {windowReservations.map((g) => (
                <div key={g.key} className="border-t border-line-divider pt-3 first:border-t-0 first:pt-0">
                  <div className="text-[11px] font-semibold text-faint">{shortDateLabel(g.res_date)}</div>
                  <div className="truncate text-[13px] font-bold text-ink">{g.lecture}</div>
                  <div className="text-[11.5px] font-bold text-brand-dark">
                    {timeRangeLabel(g.times)} · {durationLabel(g.times.length)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onBack}
        className="mb-2 inline-flex cursor-pointer items-center gap-1.5 py-2 text-[13.5px] font-semibold text-hint hover:text-ink-2"
      >
        ← 강의 목록으로
      </button>

        {/* 강의 헤더 */}
        <section className="mb-[22px] rounded-[18px] border border-line bg-white px-[30px] py-7">
          <div className="mb-3 flex items-center gap-[9px]">
            <span className="inline-flex items-center gap-[5px] rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-deep">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22a75a]" />
              예약 가능
            </span>
            {lecture.category && (
              <span className="rounded-md bg-line-soft px-2 py-0.5 text-[11.5px] font-bold text-ink-3">{lecture.category}</span>
            )}
            {lecture.level && (
              <span className="rounded-md bg-line-soft px-2 py-0.5 text-[11.5px] font-bold text-ink-3">
                {lecture.level}
              </span>
            )}
          </div>
          <h1 className="mb-2.5 text-[26px] font-extrabold tracking-[-0.7px]">{lecture.name}</h1>
          {lecture.description && (
            <p className="max-w-[680px] text-[14.5px] leading-relaxed text-ink-3">
              {lecture.description}
            </p>
          )}
        </section>

        {/* 날짜 */}
        <section className="mb-[22px]">
          <Calendar selected={selectedDate} onSelect={onSelectDate} />
        </section>

        {/* 시간대 */}
        <section className="rounded-[18px] border border-line bg-white px-7 py-[26px]">
          <div className="mb-[14px] flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold tracking-[-0.3px]">
              시간대 선택{" "}
              <span className="font-semibold text-faint">· {dateLabel(selectedDate)}</span>
            </h2>
          </div>

          <div className="mb-[16px] flex flex-wrap gap-x-4 gap-y-1.5 border-b border-line-divider pb-3 text-[12px] font-semibold text-hint">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>오늘부터 3주 이내 날짜만 예약할 수 있어요.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>강의별 일주일 최대 4시간까지 예약할 수 있습니다.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>연속 예약은 최대 2시간까지 가능합니다.</span>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(82px,1fr))] gap-2.5">
            {TIME_SLOTS.map((time) => {
              const mine = myTimes.includes(time);
              const taken = reservedTimes.includes(time) && !mine;
              const otherBusy = otherLectureBusyTimes.includes(time);
              const past = isToday && minutesOf(time) <= currentMinutes;
              const wanted = desiredTimes.includes(time);
              const conflictingSelection = otherBusy && wanted && !mine;

              const disabled = taken || (otherBusy && !wanted) || past;

              let cls: string;
              let seatCls: string;
              let seatText: string;

   
              if (past && mine) {
                cls = "bg-brand-soft border-brand-line text-brand cursor-not-allowed opacity-60";
                seatCls = "text-brand";
                seatText = "내 지난 예약";
              } else if (past) {
                cls = "bg-surface-sunken border-line-soft text-disabled-2 cursor-not-allowed";
                seatCls = "text-disabled-2";
                seatText = "지난 시간";
              } else if (taken) {
                cls = "bg-surface-sunken border-line-soft text-[#8b93a3] cursor-not-allowed";
                seatCls = "text-disabled";
                seatText = "예약됨";
              } else if (conflictingSelection) {
                cls = "bg-danger-soft border-danger-line text-danger cursor-pointer";
                seatCls = "text-danger";
                seatText = "시간 중복";
              } else if (otherBusy) {
                cls = "bg-surface-sunken border-line-soft text-[#8b93a3] cursor-not-allowed";
                seatCls = "text-disabled";
                seatText = "다른 강의 예약";
              } else if (mine && !wanted) {
                cls = "bg-danger-soft border-danger-line text-danger cursor-pointer";
                seatCls = "text-danger";
                seatText = "취소 예정";
              } else if (mine) {
                cls = "bg-brand-soft border-brand-line text-brand cursor-pointer hover:border-brand";
                seatCls = "text-brand";
                seatText = "내 예약";
              } else if (wanted) {
                cls =
                  "bg-brand-dark border-brand-dark text-white cursor-pointer shadow-[0_6px_16px_rgba(30,122,52,0.25)]";
                seatCls = "text-[#cbeed3]";
                seatText = "추가";
              } else {
                cls = "bg-white border-[#dbe0ea] text-ink cursor-pointer hover:border-brand-line";
                seatCls = "text-brand-deep";
                seatText = "예약 가능";
              }

              return (
                <button
                  key={time}
                  disabled={disabled}
                  onClick={() => onToggleTime(time)}
                  className={`flex flex-col items-center gap-1 rounded-[12px] border px-2 py-2.5 transition-all ${cls}`}
                >
                  <span className="text-[14px] font-extrabold tracking-[-0.2px]">{time}</span>
                  <span className={`text-[10.5px] font-semibold ${seatCls}`}>{seatText}</span>
                </button>
              );
            })}
          </div>
        </section>

  
        <section className="mt-[22px] rounded-[18px] border border-line bg-white px-7 py-[22px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-0.5 text-xs font-semibold text-faint">
                  {shouldRemoveCurrentCart
                    ? "현재 선택이 원래 예약 상태입니다"
                    : hasPendingSelection
                      ? currentCartItem
                    ? `현재 선택이 ${cartListLabel}과 다릅니다`
                    : `현재 선택이 아직 ${cartListLabel}에 없습니다`
                  : selectionMatchesCart
                    ? `${cartListLabel}에 담긴 선택`
                : isDirty
                  ? `${dateLabel(selectedDate)} · 저장 후 ${durationLabel(desiredTimes.length)}`
                  : cartItems.length > 0
                    ? `${cartListLabel} · ${cartItems.length}개 항목`
                    : "선택한 예약"}
              </div>
              <div className="truncate text-[15px] font-bold text-ink">
                {shouldRemoveCurrentCart ? (
                  `${dateLabel(selectedDate)} · 변경 사항이 없습니다 · 목록에서 제거해주세요`
                ) : hasPendingSelection ? (
                  <span className="flex flex-wrap gap-x-2">
                    <span>{dateLabel(selectedDate)}</span>
                    {toAdd.length > 0 && (
                      <span className="text-brand-dark">+{timeRangeLabel(toAdd)}</span>
                    )}
                    {toRemove.length > 0 && (
                      <span className="text-danger">−{timeRangeLabel(toRemove)}</span>
                    )}
                    <span className="text-hint">목록에 반영해주세요</span>
                  </span>
                ) : selectionMatchesCart ? (
                  <span className="flex flex-wrap gap-x-2">
                    <span>{dateLabel(selectedDate)}</span>
                    {currentCartItem.addTimes.length > 0 && (
                      <span className="text-brand-dark">+{timeRangeLabel(currentCartItem.addTimes)}</span>
                    )}
                    {currentCartItem.removeTimes.length > 0 && (
                      <span className="text-danger">−{timeRangeLabel(currentCartItem.removeTimes)}</span>
                    )}
                    <span className="text-hint">목록에 담김</span>
                  </span>
                ) : !isDirty ? (
                  cartItems.length > 0
                    ? `${durationLabel(
                        cartItems.reduce(
                          (sum, item) => sum + item.addTimes.length + item.removeTimes.length,
                          0,
                        ),
                      )} 변경 대기 중`
                    : myTimes.length > 0
                    ? `${dateLabel(selectedDate)} · ${myTimes.join(", ")} · ${durationLabel(myTimes.length)} 예약 중`
                    : "시간대를 선택해 주세요"
                ) : (
                  <span className="flex flex-wrap gap-x-2">
                    {toAdd.length > 0 && (
                      <span className="text-brand-dark">+{durationLabel(toAdd.length)} 추가</span>
                    )}
                    {toRemove.length > 0 && (
                      <span className="text-danger">−{durationLabel(toRemove.length)} 취소</span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                onClick={handlePrimary}
                disabled={!canPrimary}
                className={`rounded-xl px-[30px] py-3.5 text-[15px] font-bold whitespace-nowrap transition-colors ${
                  canPrimary
                    ? "cursor-pointer bg-brand-dark text-white hover:bg-brand"
                    : "cursor-not-allowed bg-[#e4e7ee] text-[#8b93a3]"
                }`}
              >
                {primaryLabel}
              </button>
            </div>
          </div>
        </section>

        {cartItems.length > 0 && (
          <section className="mt-[22px] rounded-[18px] border border-line bg-white px-7 py-[24px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold tracking-[-0.3px]">{cartListLabel}</h2>
              <span className="text-[12px] font-bold text-hint">
                {durationLabel(
                  cartItems.reduce(
                    (sum, item) => sum + item.addTimes.length + item.removeTimes.length,
                    0,
                  ),
                )} 변경 대기 중
              </span>
            </div>
            <div className="flex flex-col divide-y divide-line-divider">
              {cartItems.map((item) => (
                <div key={item.key} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-ink">{item.lecture}</div>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[12.5px] font-semibold text-faint">
                      <span>{dateLabel(item.date)}</span>
                      {item.addTimes.length > 0 && (
                        <span className="text-brand-dark">
                          +{timeRangeLabel(item.addTimes)} · {durationLabel(item.addTimes.length)} 추가
                        </span>
                      )}
                      {item.removeTimes.length > 0 && (
                        <span className="text-danger">
                          −{timeRangeLabel(item.removeTimes)} · {durationLabel(item.removeTimes.length)} 취소
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveCartItem(item.key)}
                    disabled={loading}
                    className="cursor-pointer rounded-[10px] border border-line-input bg-white px-3 py-2 text-[12.5px] font-bold whitespace-nowrap text-ink-3 hover:border-danger-line hover:text-danger disabled:opacity-50"
                  >
                    목록에서 제거
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
    </main>
  );
}
