"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AdminReservation {
  id: number;
  res_time: string;
  lecture: string;
  student_id: number;
  user_name: string;
}

interface AllAdminReservation extends AdminReservation {
  res_date: string;
}

interface MemberSummary {
  student_id: number;
  user_name: string;
  primaryLecture: string;
  lectureExtraCount: number;
  primaryDate: string;
  dateExtraCount: number;
}

function shortDateLabel(s: string): string {
  const [, m, d] = s.split("-").map(Number);
  return `${m}월 ${d}일`;
}

function timeRangeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const endMinutes = h * 60 + m + 30;
  const endLabel =
    endMinutes === 24 * 60
      ? "24:00"
      : `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  return `${time} - ${endLabel}`;
}

function summarizeByMember(rows: AllAdminReservation[]): MemberSummary[] {
  const byStudent = new Map<number, AllAdminReservation[]>();
  for (const r of rows) {
    const list = byStudent.get(r.student_id) ?? [];
    list.push(r);
    byStudent.set(r.student_id, list);
  }

  const summaries: MemberSummary[] = [];
  for (const list of byStudent.values()) {
    const sorted = [...list].sort((a, b) =>
      a.res_date === b.res_date
        ? a.res_time.localeCompare(b.res_time)
        : a.res_date.localeCompare(b.res_date),
    );
    const earliest = sorted[0];
    const lectureCount = new Set(list.map((r) => r.lecture)).size;
    const dateCount = new Set(list.map((r) => r.res_date)).size;

    summaries.push({
      student_id: earliest.student_id,
      user_name: earliest.user_name,
      primaryLecture: earliest.lecture,
      lectureExtraCount: lectureCount - 1,
      primaryDate: earliest.res_date,
      dateExtraCount: dateCount - 1,
    });
  }

  return summaries.sort((a, b) => a.primaryDate.localeCompare(b.primaryDate));
}

const MEMBERS_PAGE_SIZE = 5;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateLabel(s: string): string {
  const d = fromDateStr(s);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

export default function LectureAdminView() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [view, setView] = useState(() => {
    const d = fromDateStr(todayStr());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allReservations, setAllReservations] = useState<AllAdminReservation[]>([]);
  const [memberSummaries, setMemberSummaries] = useState<MemberSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [membersPage, setMembersPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/lecture-reservations?date=${selectedDate}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const body = await res.json();
        if (!cancelled) setReservations(body.reservations ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("예약 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/lecture-reservations/summary")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const body = await res.json();
        const rows: AllAdminReservation[] = (body.reservations ?? []).filter(
          (r: AllAdminReservation) => r.res_date >= todayStr(),
        );
        if (!cancelled) {
          setAllReservations(rows);
          setMemberSummaries(summarizeByMember(rows));
        }
      })
      .catch(() => {
        if (!cancelled) setSummaryError("예약자 요약을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1))),
  ];
  const today = todayStr();

  const membersTotalPages = Math.max(1, Math.ceil(memberSummaries.length / MEMBERS_PAGE_SIZE));
  const pagedMemberSummaries = memberSummaries.slice(
    (membersPage - 1) * MEMBERS_PAGE_SIZE,
    membersPage * MEMBERS_PAGE_SIZE,
  );

  const selectedMember = memberSummaries.find((m) => m.student_id === selectedStudentId) ?? null;
  const selectedReservations = selectedStudentId === null
    ? []
    : [...allReservations]
        .filter((r) => r.student_id === selectedStudentId)
        .sort((a, b) =>
          a.res_date === b.res_date
            ? a.res_time.localeCompare(b.res_time)
            : a.res_date.localeCompare(b.res_date),
        );

  return (
    <main className="mx-auto max-w-[900px] px-5 pt-11 pb-20 sm:px-7">
      <h1 className="mb-2 text-[22px] font-extrabold tracking-[-0.5px]">인강 예약 현황</h1>
      <p className="mb-8 text-[14px] text-hint">날짜를 선택하면 그날 예약자 명단을 볼 수 있습니다.</p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[18px] border border-line bg-white px-6 py-[22px]">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="h-8 w-8 rounded-lg border border-line text-sm text-hint hover:border-brand-line"
            >
              ‹
            </button>
            <span className="text-sm font-bold">{year}년 {month + 1}월</span>
            <button
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="h-8 w-8 rounded-lg border border-line text-sm text-hint hover:border-brand-line"
            >
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-center text-xs font-semibold text-faint">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`pad-${i}`} className="h-10" />;
              const day = Number(dateStr.slice(-2));
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === today;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-10 rounded-lg text-sm font-semibold ${
                    isSelected
                      ? "bg-brand-dark text-white"
                      : isToday
                        ? "border border-brand-line text-ink"
                        : "text-ink-3 hover:bg-surface-sunken"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-white px-6 py-[22px]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">{dateLabel(selectedDate)}</h2>
            <span className="text-xs font-semibold text-faint">{reservations.length}건</span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-faint">불러오는 중…</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-danger">{error}</p>
          ) : reservations.length === 0 ? (
            <p className="py-10 text-center text-sm text-faint">예약이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-divider text-left text-xs font-semibold text-faint">
                  <th className="py-2 pr-3">시간</th>
                  <th className="py-2 pr-3">강의</th>
                  <th className="py-2 pr-3">이름</th>
                  <th className="py-2">학번</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-divider">
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-3 font-bold text-ink">{r.res_time}</td>
                    <td className="py-2.5 pr-3 text-ink-3">{r.lecture}</td>
                    <td className="py-2.5 pr-3 text-ink-3">{r.user_name}</td>
                    <td className="py-2.5 text-faint">{r.student_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-[18px] border border-line bg-white px-6 py-[22px]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">예약한 학회원</h2>
          <span className="text-xs font-semibold text-faint">{memberSummaries.length}명</span>
        </div>

        {summaryLoading ? (
          <p className="py-10 text-center text-sm text-faint">불러오는 중…</p>
        ) : summaryError ? (
          <p className="py-10 text-center text-sm text-danger">{summaryError}</p>
        ) : memberSummaries.length === 0 ? (
          <p className="py-10 text-center text-sm text-faint">예약이 없습니다.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-divider text-left text-xs font-semibold text-faint">
                  <th className="py-2 pr-3">이름</th>
                  <th className="py-2 pr-3">예약 강의</th>
                  <th className="py-2">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-divider">
                {pagedMemberSummaries.map((m) => (
                  <tr
                    key={m.student_id}
                    onClick={() => setSelectedStudentId(m.student_id)}
                    className="cursor-pointer hover:bg-surface-sunken"
                  >
                    <td className="py-2.5 pr-3 font-bold text-ink">{m.user_name}</td>
                    <td className="py-2.5 pr-3 text-ink-3">
                      {m.primaryLecture}
                      {m.lectureExtraCount > 0 && ` 외 ${m.lectureExtraCount}개`}
                    </td>
                    <td className="py-2.5 text-ink-3">
                      {shortDateLabel(m.primaryDate)}
                      {m.dateExtraCount > 0 && ` 외 ${m.dateExtraCount}개 날짜`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {membersTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setMembersPage((p) => Math.max(1, p - 1))}
                  disabled={membersPage === 1}
                  className="h-8 rounded-lg border border-line px-3 text-xs font-semibold text-hint hover:border-brand-line disabled:cursor-not-allowed disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-xs font-semibold text-faint">
                  {membersPage} / {membersTotalPages}
                </span>
                <button
                  onClick={() => setMembersPage((p) => Math.min(membersTotalPages, p + 1))}
                  disabled={membersPage === membersTotalPages}
                  className="h-8 rounded-lg border border-line px-3 text-xs font-semibold text-hint hover:border-brand-line disabled:cursor-not-allowed disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={selectedStudentId !== null}
        onOpenChange={(open) => !open && setSelectedStudentId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMember?.user_name}</DialogTitle>
            <DialogDescription>
              학번 {selectedMember?.student_id} · 총 {selectedReservations.length}건
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-divider text-left text-xs font-semibold text-faint">
                  <th className="py-2 pr-3 w-[80px]">날짜</th>
                  <th className="py-2 pr-3 w-[130px]">시간</th>
                  <th className="py-2">강의</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-divider">
                {selectedReservations.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-3 font-bold text-ink">{shortDateLabel(r.res_date)}</td>
                    <td className="py-2.5 pr-3 text-ink-3">{timeRangeLabel(r.res_time)}</td>
                    <td className="py-2.5 text-ink-3">{r.lecture}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
