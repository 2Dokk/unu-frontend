"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, X, Check } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/custom/common/delete-confirm-dialog";
import { getAllQuarters, getCurrentQuarter } from "@/lib/api/quarter";
import { searchUsers } from "@/lib/api/user";
import {
  getLectureRoomSchedulesByQuarter,
  createLectureRoomSchedule,
  createLectureRoomScheduleForMe,
  deleteLectureRoomSchedule,
} from "@/lib/api/lecture-room-schedule";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { LectureRoomScheduleResponseDto } from "@/lib/interfaces/lecture-room-schedule";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { key: "MONDAY", label: "월요일" },
  { key: "TUESDAY", label: "화요일" },
  { key: "WEDNESDAY", label: "수요일" },
  { key: "THURSDAY", label: "목요일" },
  { key: "FRIDAY", label: "금요일" },
];

// 90-minute school class periods: 09:00, 10:30, 12:00, 13:30, 15:00, 16:30, 18:00
const TIME_SLOTS: string[] = [
  "09:00:00",
  "10:30:00",
  "12:00:00",
  "13:30:00",
  "15:00:00",
  "16:30:00",
  "18:00:00",
];

const USER_COLORS = [
  { bg: "#DBEAFE", border: "#93C5FD", text: "#1E40AF" },
  { bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
  { bg: "#FEF3C7", border: "#FCD34D", text: "#92400E" },
  { bg: "#FCE7F3", border: "#F9A8D4", text: "#9D174D" },
  { bg: "#EDE9FE", border: "#C4B5FD", text: "#4C1D95" },
  { bg: "#FEE2E2", border: "#FCA5A5", text: "#991B1B" },
  { bg: "#FFEDD5", border: "#FDBA74", text: "#9A3412" },
  { bg: "#E0F2FE", border: "#7DD3FC", text: "#075985" },
  { bg: "#ECFDF5", border: "#34D399", text: "#064E3B" },
  { bg: "#FDF4FF", border: "#E879F9", text: "#86198F" },
];

function formatSlotTime(slot: string) {
  return slot.slice(0, 5);
}

function getEndTime(toIdx: number): string {
  if (toIdx + 1 < TIME_SLOTS.length)
    return formatSlotTime(TIME_SLOTS[toIdx + 1]);
  return "19:30";
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function LectureRoomSchedulePage() {
  const { userRole } = useAuth();
  const canAssign = userRole === "ADMIN" || userRole === "MANAGER";

  // Data
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>("");
  const [schedules, setSchedules] = useState<LectureRoomScheduleResponseDto[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  // Drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragDay, setDragDay] = useState<string | null>(null);
  const [dragStartIdx, setDragStartIdx] = useState<number>(-1);
  const [dragEndIdx, setDragEndIdx] = useState<number>(-1);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Admin user search (multi-select)
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserResponseDto[]>(
    [],
  );
  const [selectedUsers, setSelectedUsers] = useState<UserResponseDto[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Filter
  const [hiddenUserIds, setHiddenUserIds] = useState<Set<string>>(new Set());

  const toggleUserVisibility = (userId: string) => {
    setHiddenUserIds((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  // Delete
  const [deleteTarget, setDeleteTarget] =
    useState<LectureRoomScheduleResponseDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Derived: schedule map (slot → multiple schedules) & color map ──────────

  // scheduleMap[day][slot] = array of schedules for that slot
  const scheduleMap: Record<
    string,
    Record<string, LectureRoomScheduleResponseDto[]>
  > = {};
  const userColorMap: Record<string, number> = {};
  const userList: { id: string; name: string; colorIdx: number }[] = [];
  let colorIdx = 0;

  for (const s of schedules) {
    if (!scheduleMap[s.dayOfWeek]) scheduleMap[s.dayOfWeek] = {};
    if (!scheduleMap[s.dayOfWeek][s.timeSlot])
      scheduleMap[s.dayOfWeek][s.timeSlot] = [];
    scheduleMap[s.dayOfWeek][s.timeSlot].push(s);

    if (userColorMap[s.userId] === undefined) {
      userColorMap[s.userId] = colorIdx % USER_COLORS.length;
      userList.push({
        id: s.userId,
        name: s.userName,
        colorIdx: colorIdx % USER_COLORS.length,
      });
      colorIdx++;
    }
  }

  // ─── Load quarters ──────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([getAllQuarters(), getCurrentQuarter().catch(() => null)]).then(
      ([data, current]) => {
        setQuarters(data);
        const defaultId = current?.id ?? data[0]?.id;
        if (defaultId) setSelectedQuarterId(defaultId);
      },
    );
  }, []);

  // ─── Load schedules ─────────────────────────────────────────────────────────

  const loadSchedules = useCallback(async () => {
    if (!selectedQuarterId) return;
    setLoading(true);
    try {
      const data = await getLectureRoomSchedulesByQuarter(selectedQuarterId);
      setSchedules(data);
    } finally {
      setLoading(false);
    }
  }, [selectedQuarterId]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // ─── Drag handlers ──────────────────────────────────────────────────────────

  const startDrag = (day: string, idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragDay(day);
    setDragStartIdx(idx);
    setDragEndIdx(idx);
  };

  const handleCellMouseEnter = (day: string, idx: number) => {
    if (!isDragging || dragDay !== day) return;
    setDragEndIdx(idx);
  };

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      if (dragDay && dragStartIdx >= 0) {
        setCreateOpen(true);
      }
      setIsDragging(false);
    }
  }, [isDragging, dragDay, dragStartIdx]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // Drag range: preserved while dragging or while create dialog is open
  const dragRange =
    isDragging || createOpen
      ? dragStartIdx >= 0 && dragEndIdx >= 0 && dragDay
        ? {
            day: dragDay,
            from: Math.min(dragStartIdx, dragEndIdx),
            to: Math.max(dragStartIdx, dragEndIdx),
          }
        : null
      : null;

  const isCellSelected = (day: string, idx: number) =>
    dragRange !== null &&
    dragRange.day === day &&
    idx >= dragRange.from &&
    idx <= dragRange.to;

  // ─── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async (userIds?: string[]) => {
    if (!selectedQuarterId || !dragDay || dragStartIdx < 0 || dragEndIdx < 0)
      return;
    setCreating(true);
    const from = Math.min(dragStartIdx, dragEndIdx);
    const to = Math.max(dragStartIdx, dragEndIdx);
    const slots = TIME_SLOTS.slice(from, to + 1);

    if (userIds && userIds.length > 0) {
      await Promise.all(
        userIds.flatMap((uid) =>
          slots.map((slot) =>
            createLectureRoomSchedule({
              quarterId: selectedQuarterId,
              dayOfWeek: dragDay!,
              timeSlot: slot,
              userId: uid,
            }).catch(() => {}),
          ),
        ),
      );
    } else {
      await Promise.all(
        slots.map((slot) =>
          createLectureRoomScheduleForMe({
            quarterId: selectedQuarterId,
            dayOfWeek: dragDay!,
            timeSlot: slot,
          }).catch(() => {}),
        ),
      );
    }

    await loadSchedules();
    setCreating(false);
    closeCreateDialog();
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLectureRoomSchedule(deleteTarget.id);
      await loadSchedules();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const closeCreateDialog = () => {
    setCreateOpen(false);
    setDragDay(null);
    setDragStartIdx(-1);
    setDragEndIdx(-1);
    setUserSearchQuery("");
    setUserSearchResults([]);
    setSelectedUsers([]);
  };

  const handleUserSearch = async () => {
    if (!userSearchQuery.trim()) return;
    setSearchingUsers(true);
    try {
      const results = await searchUsers({ name: userSearchQuery.trim() });
      setUserSearchResults(results);
    } finally {
      setSearchingUsers(false);
    }
  };

  const toggleUser = (u: UserResponseDto) => {
    setSelectedUsers((prev) =>
      prev.some((p) => p.id === u.id)
        ? prev.filter((p) => p.id !== u.id)
        : [...prev, u],
    );
  };

  const selectedTimeLabel = dragRange
    ? `${DAYS.find((d) => d.key === dragRange.day)?.label} ${formatSlotTime(TIME_SLOTS[dragRange.from])} ~ ${getEndTime(dragRange.to)}`
    : "";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">관리자 시간표</h1>
          <p className="text-sm text-muted-foreground">관리자용 시간표입니다</p>
        </div>
        <Select value={selectedQuarterId} onValueChange={setSelectedQuarterId}>
          <SelectTrigger className="w-auto h-7 border-0 shadow-none bg-transparent px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md gap-1 [&>svg]:opacity-50">
            <SelectValue placeholder="분기 선택" />
          </SelectTrigger>
          <SelectContent>
            {quarters.map((quarter) => (
              <SelectItem key={quarter.id} value={quarter.id.toString()}>
                {quarter.year} {quarter.season}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timetable + Legend */}
      <div className="flex gap-4 items-start">
        {/* Timetable */}
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              드래그로 시간을 선택하여 예약하세요. 예약된 셀을 클릭하면 삭제할
              수 있습니다.
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div
                className="overflow-auto rounded border border-border"
                style={{ maxHeight: "600px", userSelect: "none" }}
              >
                <table
                  className="border-collapse text-xs w-full"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col style={{ width: "48px" }} />
                    {DAYS.map((day) => (
                      <col key={day.key} />
                    ))}
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr>
                      <th className="sticky left-0 z-20 bg-background border border-border px-2 py-1.5 text-right text-muted-foreground font-normal" />
                      {DAYS.map((day) => (
                        <th
                          key={day.key}
                          className="border border-border px-2 py-1.5 text-center font-medium"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot, idx) => {
                      return (
                        <tr
                          key={slot}
                          style={{ borderTop: "2px solid #CBD5E1" }}
                        >
                          {/* Time label */}
                          <td
                            className="sticky left-0 bg-background border-r border-border text-right pr-2 text-muted-foreground"
                            style={{
                              minWidth: "48px",
                              width: "48px",
                              height: "56px",
                              fontSize: "11px",
                              verticalAlign: "top",
                              paddingTop: "4px",
                            }}
                          >
                            {formatSlotTime(slot)}
                          </td>

                          {/* Day cells */}
                          {DAYS.map((day) => {
                            const slotSchedules = (
                              scheduleMap[day.key]?.[slot] ?? []
                            )
                              .filter((s) => !hiddenUserIds.has(s.userId))
                              .sort((a, b) => a.userId.localeCompare(b.userId));
                            const selected = isCellSelected(day.key, idx);

                            return (
                              <td
                                key={day.key}
                                className="border cursor-pointer"
                                style={{
                                  height: "56px",
                                  padding: 0,
                                  borderColor: "#E2E8F0",
                                  backgroundColor: selected
                                    ? "#BFDBFE"
                                    : undefined,
                                }}
                                onMouseDown={
                                  slotSchedules.length === 0
                                    ? (e) => startDrag(day.key, idx, e)
                                    : undefined
                                }
                                onMouseEnter={() =>
                                  handleCellMouseEnter(day.key, idx)
                                }
                              >
                                {/* Split sub-sections per user (hidden when selected) */}
                                {!selected && slotSchedules.length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      height: "100%",
                                      width: "100%",
                                    }}
                                  >
                                    {slotSchedules.map((s) => {
                                      const ci = userColorMap[s.userId] ?? 0;
                                      const c = USER_COLORS[ci];
                                      return (
                                        <div
                                          key={s.id}
                                          title={`${s.userName} (${formatSlotTime(slot)})`}
                                          style={{
                                            flex: 1,
                                            backgroundColor: c.bg,
                                            borderRight: `1px solid ${c.border}`,
                                          }}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteTarget(s);
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend sidebar */}
        <div className="w-44 shrink-0 sticky top-6">
          <Card className="gap-2 py-2">
            <CardHeader className="pt-2">
              <CardTitle className="text-sm">관리자 목록</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              {userList.length === 0 ? (
                <p className="text-xs text-muted-foreground">예약이 없습니다</p>
              ) : (
                <div className="space-y-1.5">
                  {userList.map((u) => {
                    const color = USER_COLORS[u.colorIdx];
                    const visible = !hiddenUserIds.has(u.id);
                    return (
                      <div
                        key={u.id}
                        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border cursor-pointer select-none"
                        style={{
                          backgroundColor: visible ? color.bg : undefined,
                          borderColor: visible ? color.border : "#E2E8F0",
                          color: visible ? color.text : "#94A3B8",
                          opacity: visible ? 1 : 0.5,
                        }}
                        onClick={() => toggleUserVisibility(u.id)}
                      >
                        <Checkbox
                          checked={visible}
                          onCheckedChange={() => toggleUserVisibility(u.id)}
                          style={
                            visible
                              ? {
                                  borderColor: color.border,
                                  backgroundColor: color.border,
                                }
                              : undefined
                          }
                        />
                        <span className="truncate">{u.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Create Dialog ──────────────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => !open && closeCreateDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시간표 등록</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selected range info */}
            <div className="rounded bg-muted px-3 py-2 text-sm font-medium">
              {selectedTimeLabel}
            </div>

            {canAssign && (
              <div className="space-y-2">
                <Label>학회원 검색</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="이름으로 검색"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleUserSearch}
                    disabled={searchingUsers}
                  >
                    {searchingUsers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {userSearchResults.length > 0 && (
                  <div className="border rounded divide-y max-h-36 overflow-auto">
                    {userSearchResults.map((u) => {
                      const isSelected = selectedUsers.some(
                        (s) => s.id === u.id,
                      );
                      return (
                        <button
                          key={u.id}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between ${
                            isSelected ? "bg-muted" : ""
                          }`}
                          onClick={() => toggleUser(u)}
                        >
                          <span>
                            {u.name}
                            <span className="text-muted-foreground ml-2 text-xs">
                              {u.studentId}
                            </span>
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map((u) => (
                      <Badge
                        key={u.id}
                        variant="secondary"
                        className="flex items-center gap-1 pl-2 pr-1"
                      >
                        {u.name}
                        <button
                          className="rounded hover:bg-muted-foreground/20 p-0.5"
                          onClick={() => toggleUser(u)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeCreateDialog}
              disabled={creating}
            >
              취소
            </Button>
            <Button
              onClick={() =>
                handleCreate(
                  canAssign ? selectedUsers.map((u) => u.id) : undefined,
                )
              }
              disabled={creating || (canAssign && selectedUsers.length === 0)}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ─────────────────────────────────────────────────────── */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="예약을 삭제하시겠어요?"
        itemValue={
          deleteTarget
            ? `${deleteTarget.userName} — ${DAYS.find((d) => d.key === deleteTarget.dayOfWeek)?.label} ${formatSlotTime(deleteTarget.timeSlot)}`
            : ""
        }
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
