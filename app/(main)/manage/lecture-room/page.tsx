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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, X, Check, ClipboardPaste } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { getAllQuarters, getCurrentQuarter } from "@/lib/api/quarter";
import { searchUserSummaries } from "@/lib/api/user";
import {
  getLectureRoomSchedulesByQuarter,
  createLectureRoomSchedule,
  createLectureRoomScheduleForMe,
  deleteLectureRoomSchedule,
  importLectureRoomSchedulesFromGoogleForm,
} from "@/lib/api/lecture-room-schedule";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { UserSummaryDto } from "@/lib/interfaces/auth";
import {
  LectureRoomScheduleImportUser,
  LectureRoomScheduleResponseDto,
} from "@/lib/interfaces/lecture-room-schedule";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { key: "MONDAY", label: "월요일", short: "월" },
  { key: "TUESDAY", label: "화요일", short: "화" },
  { key: "WEDNESDAY", label: "수요일", short: "수" },
  { key: "THURSDAY", label: "목요일", short: "목" },
  { key: "FRIDAY", label: "금요일", short: "금" },
];

const TIME_SLOTS: string[] = [
  "09:00:00",
  "10:15:00",
  "11:45:00",
  "13:15:00",
  "14:45:00",
  "16:15:00",
  "17:45:00",
  "19:15:00",
];

const TIME_SLOT_ENDS = [
  "10:15",
  "11:45",
  "13:15",
  "14:45",
  "16:15",
  "17:45",
  "19:15",
  "20:45",
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

const IMPORT_DAY_COLUMNS = [
  { header: "월요일관리가능한시간", dayOfWeek: "MONDAY" },
  { header: "화요일관리가능한시간", dayOfWeek: "TUESDAY" },
  { header: "수요일관리가능한시간", dayOfWeek: "WEDNESDAY" },
  { header: "목요일관리가능한시간", dayOfWeek: "THURSDAY" },
  { header: "금요일관리가능한시간", dayOfWeek: "FRIDAY" },
] as const;

interface ImportPreviewRow extends LectureRoomScheduleImportUser {
  lineNumber: number;
  name: string;
}

interface ImportPreview {
  rows: ImportPreviewRow[];
  errors: string[];
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").replace(/\s+/g, "").toLowerCase();
}

function cleanCell(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"').trim();
  }
  return trimmed;
}

function parseGoogleFormResponses(value: string): ImportPreview {
  const lines = value
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], errors: ["구글 시트에서 제목 행과 응답 행을 함께 붙여넣어 주세요."] };
  }

  const headers = lines[0].split("\t").map(normalizeHeader);
  const studentIdIndex = headers.findIndex((header) =>
    header.startsWith("학번"),
  );
  const nameIndex = headers.findIndex((header) => header.startsWith("이름"));
  const dayIndexes = IMPORT_DAY_COLUMNS.map((column) => ({
    ...column,
    index: headers.findIndex((header) => header === column.header),
  }));
  const errors: string[] = [];

  if (studentIdIndex < 0) errors.push("'학번' 열을 찾을 수 없습니다.");
  if (nameIndex < 0) errors.push("'이름' 열을 찾을 수 없습니다.");
  dayIndexes.forEach((column) => {
    if (column.index < 0) errors.push(`'${column.header.slice(0, 3)} 관리 가능한 시간' 열을 찾을 수 없습니다.`);
  });
  if (errors.length > 0) return { rows: [], errors };
  if (lines.length === 1) {
    return { rows: [], errors: ["붙여넣은 표에 응답 행이 없습니다."] };
  }

  const rows: ImportPreviewRow[] = [];
  const seenStudentIds = new Set<string>();

  lines.slice(1).forEach((line, rowIndex) => {
    const lineNumber = rowIndex + 2;
    const cells = line.split("\t");
    const studentId = cleanCell(cells[studentIdIndex]);
    const name = cleanCell(cells[nameIndex]);
    const rowErrors: string[] = [];
    const slots: LectureRoomScheduleImportUser["slots"] = [];

    if (!/^\d{8}$/.test(studentId)) {
      rowErrors.push("학번이 8자리 숫자가 아닙니다");
    } else if (seenStudentIds.has(studentId)) {
      rowErrors.push(`학번 ${studentId}이 중복되었습니다`);
    } else {
      seenStudentIds.add(studentId);
    }
    if (!name) rowErrors.push("이름이 비어 있습니다");

    dayIndexes.forEach((column) => {
      const answer = cleanCell(cells[column.index]);
      if (!answer) {
        rowErrors.push(`${column.header.slice(0, 3)} 응답이 비어 있습니다`);
        return;
      }
      if (answer === "없음") return;

      const options = answer.split(",").map((option) => option.trim());
      if (options.some((option) => option === "없음")) {
        rowErrors.push(`${column.header.slice(0, 3)}의 '없음'은 다른 시간과 함께 선택할 수 없습니다`);
        return;
      }
      options.forEach((option) => {
        const match = option.match(/^([1-8])\s*교시(?:\s*\([^)]*\))?$/);
        if (!match) {
          rowErrors.push(`${column.header.slice(0, 3)}의 '${option}'을 교시로 해석할 수 없습니다`);
          return;
        }
        const period = Number(match[1]);
        if (
          !slots.some(
            (slot) =>
              slot.dayOfWeek === column.dayOfWeek && slot.period === period,
          )
        ) {
          slots.push({ dayOfWeek: column.dayOfWeek, period });
        }
      });
    });

    if (rowErrors.length > 0) {
      errors.push(`${lineNumber}행: ${rowErrors.join(", ")}`);
      return;
    }
    rows.push({ lineNumber, studentId, name, slots });
  });

  return { rows, errors };
}

function importErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
    return error.response.data;
  }
  return "시간표 응답을 반영하지 못했습니다.";
}

function formatSlotTime(slot: string) {
  return slot.slice(0, 5);
}

function getClassEndTime(slot: string): string {
  const index = TIME_SLOTS.indexOf(slot);
  return TIME_SLOT_ENDS[index] ?? formatSlotTime(slot);
}

function getEndTime(toIdx: number): string {
  return getClassEndTime(TIME_SLOTS[toIdx]);
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function LectureRoomSchedulePage() {
  const { userRole, userId } = useAuth();
  const canManageAll = userRole === "ADMIN" || userRole === "MANAGER";
  const isAdmin = userRole === "ADMIN";

  // Data
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<QuarterResponse | null>(
    null,
  );
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>("");
  const [schedules, setSchedules] = useState<LectureRoomScheduleResponseDto[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  // Slot dialog
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number>(-1);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // User search (admin/manager only)
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSummaryDto[]>(
    [],
  );
  const [selectedUsers, setSelectedUsers] = useState<UserSummaryDto[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Filter
  const [hiddenUserIds, setHiddenUserIds] = useState<Set<string>>(new Set());

  // Google Form import (admin only)
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);

  const toggleUserVisibility = (uid: string) => {
    setHiddenUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

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
    if (canManageAll) {
      // ADMIN/MANAGER: 기존과 동일하게 전체 분기 로드 + 현재 분기를 기본 선택.
      Promise.all([
        getAllQuarters(),
        getCurrentQuarter().catch(() => null),
      ]).then(([data, current]) => {
        setQuarters(data);
        setCurrentQuarter(current);
        const defaultId = current?.id ?? data[0]?.id;
        if (defaultId) setSelectedQuarterId(defaultId);
      });
    } else {
      // LECTURE_ROOM_MANAGER: 전체 분기 목록을 로드하지 않고 현재 분기만 조회·고정한다.
      // 현재 분기를 확인할 수 없으면 다른 분기로 fallback하지 않고 비운다(시간표도 로드되지 않음).
      getCurrentQuarter()
        .then((current) => {
          setCurrentQuarter(current);
          setSelectedQuarterId(current.id);
        })
        .catch(() => {
          setCurrentQuarter(null);
          setSelectedQuarterId("");
        });
    }
  }, [canManageAll]);

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

  // ─── Click handler ──────────────────────────────────────────────────────────

  const handleCellClick = (day: string, idx: number) => {
    setSelectedDay(day);
    setSelectedSlotIdx(idx);
    setSlotDialogOpen(true);
  };

  const isCellSelected = (day: string, idx: number) =>
    slotDialogOpen && selectedDay === day && selectedSlotIdx === idx;

  // Schedules for the currently open dialog slot
  const dialogSlot = selectedSlotIdx >= 0 ? TIME_SLOTS[selectedSlotIdx] : null;
  const dialogSchedules =
    selectedDay && dialogSlot
      ? (scheduleMap[selectedDay]?.[dialogSlot] ?? []).sort((a, b) =>
          a.userId.localeCompare(b.userId),
        )
      : [];
  const myDialogSchedule = dialogSchedules.find((s) => s.userId === userId);

  // ─── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedQuarterId || !selectedDay || selectedSlotIdx < 0) return;
    setCreating(true);
    const slot = TIME_SLOTS[selectedSlotIdx];

    if (canManageAll && selectedUsers.length > 0) {
      await Promise.all(
        selectedUsers.map((u) =>
          createLectureRoomSchedule({
            quarterId: selectedQuarterId,
            dayOfWeek: selectedDay,
            timeSlot: slot,
            userId: u.id,
          }).catch(() => {}),
        ),
      );
      setSelectedUsers([]);
      setUserSearchResults([]);
      setUserSearchQuery("");
    } else if (!canManageAll) {
      await createLectureRoomScheduleForMe({
        quarterId: selectedQuarterId,
        dayOfWeek: selectedDay,
        timeSlot: slot,
      }).catch(() => {});
    }

    await loadSchedules();
    setCreating(false);
    if (!canManageAll) closeSlotDialog();
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDeleteSchedule = async (scheduleId: string) => {
    setDeletingId(scheduleId);
    try {
      await deleteLectureRoomSchedule(scheduleId);
      await loadSchedules();
    } finally {
      setDeletingId(null);
      if (!canManageAll) closeSlotDialog();
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const closeSlotDialog = () => {
    setSlotDialogOpen(false);
    setSelectedDay(null);
    setSelectedSlotIdx(-1);
    setUserSearchQuery("");
    setUserSearchResults([]);
    setSelectedUsers([]);
  };

  const handleUserSearch = async () => {
    if (!userSearchQuery.trim()) return;
    setSearchingUsers(true);
    try {
      const results = await searchUserSummaries({
        name: userSearchQuery.trim(),
      });
      setUserSearchResults(results);
    } finally {
      setSearchingUsers(false);
    }
  };

  const toggleUser = (u: UserSummaryDto) => {
    setSelectedUsers((prev) =>
      prev.some((p) => p.id === u.id)
        ? prev.filter((p) => p.id !== u.id)
        : [...prev, u],
    );
  };

  const selectedTimeLabel =
    selectedDay && selectedSlotIdx >= 0
      ? `${DAYS.find((d) => d.key === selectedDay)?.label} ${formatSlotTime(TIME_SLOTS[selectedSlotIdx])} ~ ${getEndTime(selectedSlotIdx)}`
      : "";

  const closeImportDialog = () => {
    setImportDialogOpen(false);
    setImportText("");
    setImportPreview(null);
  };

  const handleAnalyzeImport = () => {
    setImportPreview(parseGoogleFormResponses(importText));
  };

  const handleImportSchedules = async () => {
    if (!isAdmin || !selectedQuarterId || !importPreview) return;
    if (importPreview.errors.length > 0 || importPreview.rows.length === 0) return;

    setImporting(true);
    try {
      const result = await importLectureRoomSchedulesFromGoogleForm({
        quarterId: selectedQuarterId,
        users: importPreview.rows.map(({ studentId, slots }) => ({
          studentId,
          slots,
        })),
      });
      toast.success(
        `${result.userCount}명의 시간표를 반영했습니다. (${result.createdCount}개 시간 등록)`,
      );
      closeImportDialog();
      await loadSchedules();
    } catch (error) {
      toast.error(importErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">관리자 시간표</h1>
          <p className="text-sm text-muted-foreground">관리자용 시간표입니다</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              disabled={!selectedQuarterId}
            >
              <ClipboardPaste className="mr-1.5 h-4 w-4" />
              응답 가져오기
            </Button>
          )}
          {canManageAll ? (
            <Select value={selectedQuarterId} onValueChange={setSelectedQuarterId}>
              <SelectTrigger className="w-auto h-7 border-0 shadow-none bg-transparent px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md gap-1 [&>svg]:opacity-50">
                <SelectValue placeholder="분기 선택" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((quarter) => (
                  <SelectItem key={quarter.id} value={quarter.id}>
                    {quarter.year} {quarter.season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
          // LECTURE_ROOM_MANAGER: 현재 분기를 dropdown이 아닌 단순 텍스트로만 표시.
            <span className="flex h-7 items-center px-2 text-sm font-medium text-muted-foreground">
              {currentQuarter ? `${currentQuarter.year} ${currentQuarter.season}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Filter chips */}
      {userList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
                <span>{u.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Timetable */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            관리 시간을 클릭하여 등록하거나 삭제할 수 있습니다.
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
                  <col style={{ width: "72px" }} />
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
                        <span className="hidden sm:inline">{day.label}</span>
                        <span className="sm:hidden">{day.short}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, idx) => {
                    return (
                      <tr key={slot} style={{ borderTop: "2px solid #CBD5E1" }}>
                        {/* Time label */}
                        <td
                          className="sticky left-0 bg-background border-r border-border text-right pr-2 text-muted-foreground"
                          style={{
                            minWidth: "72px",
                            width: "72px",
                            height: "56px",
                            fontSize: "11px",
                            verticalAlign: "middle",
                            lineHeight: "1.4",
                          }}
                        >
                          <div>{formatSlotTime(slot)}</div>
                          <div>~{getClassEndTime(slot)}</div>
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
                              className="border cursor-pointer overflow-hidden"
                              style={{
                                height: "56px",
                                padding: 0,
                                borderColor: "#E2E8F0",
                                backgroundColor: selected
                                  ? "#BFDBFE"
                                  : undefined,
                              }}
                              onClick={() => handleCellClick(day.key, idx)}
                            >
                              {/* Split sub-sections per user (hidden when selected) */}
                              {!selected && slotSchedules.length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    height: "100%",
                                    width: "100%",
                                    maxWidth: "100%",
                                    minWidth: 0,
                                    overflow: "hidden",
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
                                          flex: "1 1 0",
                                          width: 0,
                                          minWidth: 0,
                                          height: "100%",
                                          position: "relative",
                                          overflow: "hidden",
                                          backgroundColor: c.bg,
                                          borderRight: `1px solid ${c.border}`,
                                        }}
                                      >
                                        <span
                                          style={{
                                            position: "absolute",
                                            top: "4px",
                                            left: "4px",
                                            maxWidth: "calc(100% - 8px)",
                                            padding: "1px 4px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            backgroundColor: "rgba(255, 255, 255, 0.72)",
                                            borderRadius: "10px",
                                            color: c.text,
                                            fontSize: "9px",
                                            fontWeight: 600,
                                            lineHeight: "14px",
                                          }}
                                        >
                                          {s.userName}
                                        </span>
                                      </div>
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

      {isAdmin && (
        <Dialog
          open={importDialogOpen}
          onOpenChange={(open) => !open && closeImportDialog()}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>구글폼 응답 가져오기</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-import-text">응답 표</Label>
                <Textarea
                  id="schedule-import-text"
                  value={importText}
                  onChange={(event) => {
                    setImportText(event.target.value);
                    setImportPreview(null);
                  }}
                  rows={9}
                  className="resize-y font-mono text-xs"
                  placeholder="구글 시트에서 제목 행과 응답 행을 함께 복사해 붙여넣어 주세요."
                />
                <p className="text-xs text-muted-foreground">
                  학번으로 학회원 계정을 찾습니다. 반영하면 표에 포함된 학회원의 선택 분기 시간표가 교체됩니다.
                </p>
              </div>

              {importPreview && (
                <div className="space-y-3 rounded-md border p-3">
                  {importPreview.errors.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-destructive">
                        확인이 필요한 항목이 있습니다
                      </p>
                      <div className="max-h-36 space-y-1 overflow-y-auto text-xs text-destructive">
                        {importPreview.errors.map((error, index) => (
                          <p key={`${error}-${index}`}>{error}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">
                          {importPreview.rows.length}명 · 총 {importPreview.rows.reduce((sum, row) => sum + row.slots.length, 0)}개 시간
                        </span>
                        <span className="text-xs text-muted-foreground">
                          선택 분기 전체 교체
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded border">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-muted/90">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">행</th>
                              <th className="px-3 py-2 text-left font-medium">학번</th>
                              <th className="px-3 py-2 text-left font-medium">이름</th>
                              <th className="px-3 py-2 text-right font-medium">시간</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {importPreview.rows.map((row) => (
                              <tr key={row.studentId}>
                                <td className="px-3 py-2 text-muted-foreground">{row.lineNumber}</td>
                                <td className="px-3 py-2">{row.studentId}</td>
                                <td className="px-3 py-2">{row.name}</td>
                                <td className="px-3 py-2 text-right">{row.slots.length}개</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeImportDialog}>
                취소
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAnalyzeImport}
                disabled={!importText.trim() || importing}
              >
                응답 분석
              </Button>
              <Button
                type="button"
                onClick={handleImportSchedules}
                disabled={
                  importing ||
                  !importPreview ||
                  importPreview.errors.length > 0 ||
                  importPreview.rows.length === 0
                }
              >
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                시간표 반영
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Slot Dialog ────────────────────────────────────────────────────────── */}
      <Dialog
        open={slotDialogOpen}
        onOpenChange={(open) => !open && closeSlotDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTimeLabel}</DialogTitle>
          </DialogHeader>

          {canManageAll ? (
            /* ── Manager view: see all + add/delete ── */
            <div className="space-y-4">
              {/* Current users */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  등록된 관리자
                </Label>
                {dialogSchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">
                    등록된 관리자가 없습니다
                  </p>
                ) : (
                  <div className="border rounded divide-y">
                    {dialogSchedules.map((s) => {
                      const ci = userColorMap[s.userId] ?? 0;
                      const c = USER_COLORS[ci];
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <div
                              className="w-2.5 h-2.5 rounded-full border shrink-0"
                              style={{
                                backgroundColor: c.bg,
                                borderColor: c.border,
                              }}
                            />
                            {s.userName}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteSchedule(s.id)}
                            disabled={deletingId !== null}
                          >
                            {deletingId === s.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add section */}
              <div className="space-y-2">
                <Label>관리자 추가</Label>
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
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between ${
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

              <DialogFooter>
                <Button variant="outline" onClick={closeSlotDialog}>
                  닫기
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || selectedUsers.length === 0}
                >
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  추가
                </Button>
              </DialogFooter>
            </div>
          ) : myDialogSchedule ? (
            /* ── Member: already registered → delete ── */
            <>
              <p className="text-sm text-muted-foreground">
                강의실 관리자로 등록되어 있습니다.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={closeSlotDialog}>
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteSchedule(myDialogSchedule.id)}
                  disabled={deletingId !== null}
                >
                  {deletingId && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  삭제
                </Button>
              </DialogFooter>
            </>
          ) : (
            /* ── Member: not registered → add ── */
            <>
              <p className="text-sm text-muted-foreground">
                강의실 관리자로 등록하시겠습니까?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={closeSlotDialog}>
                  취소
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  확인
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
