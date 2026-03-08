"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseTimeReservationResponse } from "@/lib/interfaces/course-time-reservation";
import {
  createCourseReservation,
  deleteCourseReservation,
  getMyReservations,
  getActivityReservations,
} from "@/lib/api/course-time-reservation";

const DISPLAY_HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08 ~ 21
const MAX_DAILY_BLOCKS = 6;

// ========================
// GROUPING HELPER
// ========================

interface DateGroup {
  dateKey: string; // "yyyy-MM-dd"
  dateLabel: string; // "yyyy.MM.dd (eee)"
  timeRanges: string[]; // ["09:00 ~ 11:00", "13:00 ~ 14:00"]
  reservationIds: string[];
}

function groupAndMerge(
  reservations: CourseTimeReservationResponse[],
): DateGroup[] {
  const grouped = new Map<string, CourseTimeReservationResponse[]>();

  reservations.forEach((r) => {
    const dateKey = r.startAt.slice(0, 10);
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(r);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, list]) => {
      const sorted = [...list].sort(
        (a, b) =>
          new Date(a.startAt).getHours() - new Date(b.startAt).getHours(),
      );

      // Merge consecutive 1-hour blocks into ranges
      const merged: { start: number; end: number }[] = [];
      sorted.forEach((r) => {
        const startHour = new Date(r.startAt).getHours();
        const endHour = new Date(r.endAt).getHours();
        const last = merged[merged.length - 1];
        if (last && last.end === startHour) {
          last.end = endHour;
        } else {
          merged.push({ start: startHour, end: endHour });
        }
      });

      const pad = (n: number) => String(n).padStart(2, "0");
      const timeRanges = merged.map(
        ({ start, end }) => `${pad(start)}:00 ~ ${pad(end)}:00`,
      );

      return {
        dateKey,
        dateLabel: format(new Date(`${dateKey}T12:00:00`), "yyyy.MM.dd (eee)", {
          locale: ko,
        }),
        timeRanges,
        reservationIds: sorted.map((r) => r.id),
      };
    });
}

// ========================
// MAIN COMPONENT
// ========================

interface CourseTimeReservationCardProps {
  activityId: string;
}

export function CourseTimeReservationCard({
  activityId,
}: CourseTimeReservationCardProps) {
  const [myReservations, setMyReservations] = useState<
    CourseTimeReservationResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Dialog state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [myDayReservations, setMyDayReservations] = useState<
    CourseTimeReservationResponse[]
  >([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(new Set());
  const [othersReservedHours, setOthersReservedHours] = useState<Set<number>>(
    new Set(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete: holds all reservation IDs for a date group
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[] | null>(null);

  const loadMyReservations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyReservations({ activityId });
      setMyReservations(data);
    } catch {
      setMyReservations([]);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    loadMyReservations();
  }, [loadMyReservations]);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedBlocks(new Set());
    setOthersReservedHours(new Set());
    setError(null);
    setDayLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const [myDay, allDay] = await Promise.all([
        getMyReservations({ date: dateStr }),
        getActivityReservations(activityId, dateStr),
      ]);
      setMyDayReservations(myDay);
      console.log("Selected date reservations:", myDay);
      console.log("All reservations for the date:", allDay);

      const myIds = new Set(myDay.map((r) => r.id));
      const othersHours = new Set<number>();
      allDay
        .filter((r) => !myIds.has(r.id))
        .forEach((r) => {
          const start = new Date(r.startAt).getHours();
          const end = new Date(r.endAt).getHours();
          for (let h = start; h < end; h++) othersHours.add(h);
        });
      setOthersReservedHours(othersHours);
    } catch {
      setMyDayReservations([]);
      setOthersReservedHours(new Set());
    } finally {
      setDayLoading(false);
    }
  };

  const getMyExistingHours = (): Set<number> => {
    const hours = new Set<number>();
    myDayReservations.forEach((r) => {
      const start = new Date(r.startAt).getHours();
      const end = new Date(r.endAt).getHours();
      for (let h = start; h < end; h++) hours.add(h);
    });
    return hours;
  };

  const existingBlocksCount = () => getMyExistingHours().size;
  const remainingBlocks = () =>
    Math.max(0, MAX_DAILY_BLOCKS - existingBlocksCount());

  const toggleBlock = (hour: number) => {
    if (getMyExistingHours().has(hour) || othersReservedHours.has(hour)) return;
    setError(null);
    setSelectedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(hour)) {
        next.delete(hour);
      } else {
        if (next.size >= remainingBlocks()) {
          setError(`하루 최대 ${MAX_DAILY_BLOCKS}개 블록까지 예약 가능합니다.`);
          return prev;
        }
        next.add(hour);
      }
      return next;
    });
  };

  const getSlotState = (
    hour: number,
  ): "existing" | "others" | "selected" | "available" => {
    if (getMyExistingHours().has(hour)) return "existing";
    if (othersReservedHours.has(hour)) return "others";
    if (selectedBlocks.has(hour)) return "selected";
    return "available";
  };

  const handleConfirm = async () => {
    if (!selectedDate || selectedBlocks.size === 0) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setSubmitting(true);
    setError(null);
    try {
      await Promise.all(
        Array.from(selectedBlocks)
          .sort((a, b) => a - b)
          .map((hour) =>
            createCourseReservation({
              activityId,
              startAt: `${dateStr}T${String(hour).padStart(2, "0")}:00:00`,
              endAt: `${dateStr}T${String(hour + 1).padStart(2, "0")}:00:00`,
            }),
          ),
      );
      await loadMyReservations();
      handleDialogClose();
    } catch {
      setError("예약에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetIds) return;
    try {
      await Promise.all(
        deleteTargetIds.map((id) => deleteCourseReservation(id)),
      );
      await loadMyReservations();
    } catch {
      // ignore
    } finally {
      setDeleteTargetIds(null);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDate(undefined);
    setSelectedBlocks(new Set());
    setMyDayReservations([]);
    setOthersReservedHours(new Set());
    setError(null);
  };

  const dateGroups = groupAndMerge(myReservations);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-md font-semibold">수강 예약</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-3">
              {dateGroups.length > 0 && (
                <div className="space-y-2">
                  {dateGroups.map((group) => (
                    <div
                      key={group.dateKey}
                      className="flex items-center justify-between rounded-md border px-3 py-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {group.dateLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {group.timeRanges.join(", ")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTargetIds(group.reservationIds)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {dateGroups.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  아직 예약된 수강 일정이 없습니다
                </p>
              )}

              <Button
                onClick={() => setDialogOpen(true)}
                variant={dateGroups.length > 0 ? "outline" : "default"}
                className="w-full"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateGroups.length > 0 ? "추가 예약" : "예약하기"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservation Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !open && handleDialogClose()}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>수강 시간 예약</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Left: Calendar */}
            <div className="flex shrink-0 justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                locale={ko}
              />
            </div>

            <div className="hidden w-px bg-border sm:block" />

            {/* Right: Time blocks */}
            <div className="flex flex-1 flex-col justify-start space-y-3">
              {!selectedDate ? (
                <div className="flex h-full items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    날짜를 선택하세요.
                  </p>
                </div>
              ) : dayLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium">
                      {format(selectedDate, "M월 d일 (eee)", { locale: ko })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      하루 최대 {MAX_DAILY_BLOCKS}블록 · 이미{" "}
                      {existingBlocksCount()}블록 예약됨 · {remainingBlocks()}
                      블록 추가 가능
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {DISPLAY_HOURS.map((hour) => {
                      const state = getSlotState(hour);
                      const isDisabled =
                        state === "existing" ||
                        state === "others" ||
                        (state === "available" && remainingBlocks() === 0);
                      return (
                        <button
                          key={hour}
                          onClick={() => toggleBlock(hour)}
                          disabled={isDisabled}
                          title={
                            state === "others"
                              ? "다른 사람이 예약한 시간입니다"
                              : state === "existing"
                                ? "내가 예약한 시간입니다"
                                : undefined
                          }
                          className={cn(
                            "rounded-md border px-1.5 py-2 text-xs font-medium transition-colors",
                            state === "existing" &&
                              "cursor-not-allowed bg-muted text-muted-foreground opacity-60",
                            state === "others" &&
                              "cursor-not-allowed bg-rose-50 text-rose-400 border-rose-200 opacity-70",
                            state === "selected" &&
                              "border-primary bg-primary text-primary-foreground",
                            state === "available" &&
                              remainingBlocks() === 0 &&
                              "cursor-not-allowed opacity-40",
                            state === "available" &&
                              remainingBlocks() > 0 &&
                              "cursor-pointer hover:border-primary hover:bg-primary/10",
                          )}
                        >
                          {String(hour).padStart(2, "0")}:00
                        </button>
                      );
                    })}
                  </div>

                  {remainingBlocks() === 0 && (
                    <p className="rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                      이 날짜에는 더 이상 예약할 수 없습니다
                    </p>
                  )}

                  {selectedBlocks.size > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedBlocks.size}개 선택됨
                    </p>
                  )}

                  {error && <p className="text-xs text-destructive">{error}</p>}
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              취소
            </Button>
            <Button
              disabled={
                !selectedDate || selectedBlocks.size === 0 || submitting
              }
              onClick={handleConfirm}
            >
              {submitting
                ? "예약 중..."
                : selectedBlocks.size > 0
                  ? `${selectedBlocks.size}개 예약 확인`
                  : "예약 확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTargetIds}
        onOpenChange={(open) => !open && setDeleteTargetIds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>예약을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              해당 날짜의 수강 예약이 모두 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>돌아가기</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
