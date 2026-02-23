"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User as UserIcon,
  Plus,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActivityById, deleteActivity } from "@/lib/api/activity";
import {
  getActivityParticipantsByActivityId,
  updateActivityParticipantStatus,
  updateActivityParticipantCompleted,
} from "@/lib/api/activity-participant";
import {
  getActivitySessionsByActivityId,
  createActivitySession,
  deleteActivitySession,
} from "@/lib/api/activity-session";
import {
  getAttendancesBySessionId,
  bulkCreateAttendances,
  getAttendanceStatsByParticipantId,
  bulkUpdateAttendances,
} from "@/lib/api/attendance";
import { ActivityResponse } from "@/lib/interfaces/activity";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import { ActivitySessionResponseDto } from "@/lib/interfaces/activity-session";
import { AttendanceResponseDto } from "@/lib/interfaces/attendance";
import { AttendanceInputContent } from "@/components/custom/attendance/attendance-input-content";
import { formatDate, formatDateTime } from "@/lib/utils/date-utils";

function getActivityStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    CREATED: "준비 중",
    OPEN: "모집 중",
    RECRUITING: "모집 중",
    ONGOING: "진행 중",
    IN_PROGRESS: "진행 중",
    COMPLETED: "종료",
  };
  return statusMap[status] || status;
}

function getActivityStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "OPEN":
    case "RECRUITING":
      return "default";
    case "ONGOING":
    case "IN_PROGRESS":
      return "secondary";
    case "COMPLETED":
      return "outline";
    default:
      return "outline";
  }
}

function getParticipantStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    APPLIED: "신청",
    APPROVED: "승인",
    REJECTED: "미승인",
  };
  return statusMap[status] || status;
}

function getParticipantStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "APPLIED":
      return "secondary";
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "CANCELED":
      return "outline";
    default:
      return "outline";
  }
}

// ========================
// LOADING SKELETON
// ========================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <Separator />

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ========================
// MAIN COMPONENT
// ========================

export default function ActivityDetailManagePage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [participants, setParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [filteredParticipants, setFilteredParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Session & Attendance states
  const [sessions, setSessions] = useState<ActivitySessionResponseDto[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<
    Map<
      string,
      { presentCount: number; absentCount: number; excusedCount: number }
    >
  >(new Map());
  const [sessionAttendanceStatus, setSessionAttendanceStatus] = useState<
    Map<
      string,
      { present: number; absent: number; excused: number; total: number }
    >
  >(new Map());
  const [statsLoading, setStatsLoading] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [sessionDialogStep, setSessionDialogStep] = useState<1 | 2>(1);
  const [sessionForm, setSessionForm] = useState({
    sessionNumber: 1,
    date: "",
    description: "",
  });
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<ActivitySessionResponseDto | null>(null);
  const [attendanceData, setAttendanceData] = useState<{
    present: Set<string>;
    absent: Set<string>;
    excused: Set<string>;
  }>({ present: new Set(), absent: new Set(), excused: new Set() });
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(),
  );
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [attendanceStatusTab, setAttendanceStatusTab] = useState<
    "present" | "absent" | "excused"
  >("present");
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [completionDialog, setCompletionDialog] = useState<{
    open: boolean;
    participant: ActivityParticipantResponse | null;
  }>({ open: false, participant: null });
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Bulk update states
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [activityData, participantsData] = await Promise.all([
          getActivityById(activityId),
          getActivityParticipantsByActivityId({ activityId }),
        ]);

        setActivity(activityData);
        setParticipants(participantsData);
        setFilteredParticipants(participantsData);
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activityId]);

  // Load sessions when attendance tab is accessed
  async function loadSessions() {
    if (sessions.length > 0) return; // Already loaded

    setSessionsLoading(true);
    try {
      const sessionsData = await getActivitySessionsByActivityId(activityId);
      setSessions(
        sessionsData.sort((a, b) => a.sessionNumber - b.sessionNumber),
      );

      // Load attendance stats for approved participants
      await loadAttendanceStats();

      // Load attendance status for each session
      await loadSessionAttendanceStatus(sessionsData);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  }

  // Load attendance status for each session
  async function loadSessionAttendanceStatus(
    sessionsData: ActivitySessionResponseDto[],
  ) {
    const statusMap = new Map<
      string,
      { present: number; absent: number; excused: number; total: number }
    >();

    try {
      const attendancePromises = sessionsData.map((session) =>
        getAttendancesBySessionId(session.id).catch(() => []),
      );

      const attendanceResults = await Promise.all(attendancePromises);

      sessionsData.forEach((session, index) => {
        const attendances = attendanceResults[index];
        const present = attendances.filter(
          (a) => a.status === "PRESENT",
        ).length;
        const absent = attendances.filter((a) => a.status === "ABSENT").length;
        const excused = attendances.filter(
          (a) => a.status === "EXCUSED",
        ).length;

        statusMap.set(session.id, {
          present,
          absent,
          excused,
          total: attendances.length,
        });
      });

      setSessionAttendanceStatus(statusMap);
    } catch (error) {
      console.error("Failed to load session attendance status:", error);
    }
  }

  // Load attendance statistics for all approved participants
  async function loadAttendanceStats() {
    const approvedParticipants = participants.filter(
      (p) => p.status === "APPROVED",
    );

    if (approvedParticipants.length === 0) return;

    setStatsLoading(true);
    try {
      const statsPromises = approvedParticipants.map((p) =>
        getAttendanceStatsByParticipantId(p.id).catch(() => ({
          presentCount: 0,
          absentCount: 0,
          excusedCount: 0,
        })),
      );

      const statsResults = await Promise.all(statsPromises);
      const statsMap = new Map<
        string,
        { presentCount: number; absentCount: number; excusedCount: number }
      >();

      approvedParticipants.forEach((p, index) => {
        statsMap.set(p.id, statsResults[index]);
      });

      setAttendanceStats(statsMap);
    } catch (error) {
      console.error("Failed to load attendance stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }

  // Apply filters whenever filter states or participants change
  useEffect(() => {
    let filtered = [...participants];

    // Status filter
    if (statusFilter !== "전체") {
      filtered = filtered.filter((p) => {
        const label = getParticipantStatusLabel(p.status);
        return label === statusFilter;
      });
    }

    // Search filter (name or student ID)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const name = p.user?.name?.toLowerCase() || "";
        const studentId = p.user?.studentId?.toLowerCase() || "";
        return name.includes(query) || studentId.includes(query);
      });
    }

    setFilteredParticipants(filtered);
  }, [participants, statusFilter, searchQuery]);

  function handleEdit() {
    router.push(`/manage/activities/${activityId}/edit`);
  }

  async function handleDelete() {
    if (deleting) return;

    setDeleting(true);
    try {
      await deleteActivity(activityId);
      router.push("/manage/activities");
    } catch (error) {
      console.error("Failed to delete activity:", error);
      toast.error("활동 삭제에 실패했습니다.");
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  function handleBackToList() {
    router.push("/manage/activities");
  }

  function handleMemberClick(userId: string, e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/manage/members/${userId}`);
  }

  // Selection handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      const allIds = new Set(filteredParticipants.map((p) => p.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSelectOne(id: string, checked: boolean) {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  }

  // Per-row status update
  async function handleStatusChange(participantId: string, newStatus: string) {
    if (updatingIds.has(participantId)) return;

    setUpdatingIds((prev) => new Set(prev).add(participantId));

    try {
      await updateActivityParticipantStatus(participantId, {
        activityId,
        status: newStatus as "APPLIED" | "APPROVED" | "REJECTED",
      });

      // Update local state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, status: newStatus as any } : p,
        ),
      );

      toast.success("상태가 변경되었습니다.");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(participantId);
        return next;
      });
    }
  }

  // Bulk status update
  function handleBulkUpdateClick() {
    if (selectedIds.size === 0 || !bulkStatus) return;
    setShowBulkDialog(true);
  }

  async function handleBulkUpdateConfirm() {
    if (selectedIds.size === 0 || !bulkStatus) return;

    setBulkUpdating(true);
    const selectedArray = Array.from(selectedIds);

    // Run with limited concurrency
    const results = await runWithConcurrency(
      selectedArray,
      5,
      async (participantId) => {
        await updateActivityParticipantStatus(participantId, {
          activityId,
          status: bulkStatus as "APPLIED" | "APPROVED" | "REJECTED",
        });
        return participantId;
      },
    );

    // Count successes and failures
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    // Refresh data
    try {
      const updatedParticipants = await getActivityParticipantsByActivityId({
        activityId,
      });
      setParticipants(updatedParticipants);
    } catch (error) {
      console.error("Failed to refresh participants:", error);
    }

    // Show result
    if (failureCount === 0) {
      toast.success(`${successCount}건 변경 완료`);
    } else {
      toast.error(`${successCount}건 변경 완료, ${failureCount}건 실패`);
    }

    // Reset states
    setSelectedIds(new Set());
    setBulkStatus("");
    setShowBulkDialog(false);
    setBulkUpdating(false);
  }

  // Helper: run promises with concurrency limit
  async function runWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
  ): Promise<PromiseSettledResult<R>[]> {
    const results: PromiseSettledResult<R>[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = fn(item).then(
        (value) => {
          results.push({ status: "fulfilled", value });
        },
        (reason) => {
          results.push({ status: "rejected", reason });
        },
      );

      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1,
        );
      }
    }

    await Promise.allSettled(executing);
    return results;
  }

  // ========================
  // SESSION HANDLERS
  // ========================

  function handleOpenSessionDialog() {
    const nextSessionNumber = sessions.length + 1;
    setSessionForm({
      sessionNumber: nextSessionNumber,
      date: "",
      description: "",
    });
    setSessionDialogStep(1);
    setShowSessionDialog(true);
  }

  async function handleCreateSessionOnly() {
    if (!sessionForm.date) {
      alert("날짜를 입력해주세요.");
      return;
    }

    try {
      const newSession = await createActivitySession({
        activityId,
        sessionNumber: sessionForm.sessionNumber,
        date: sessionForm.date,
        description: sessionForm.description,
      });

      setSessions((prev) =>
        [...prev, newSession].sort((a, b) => a.sessionNumber - b.sessionNumber),
      );

      // Update session attendance status
      setSessionAttendanceStatus((prev) => {
        const newMap = new Map(prev);
        newMap.set(newSession.id, {
          present: 0,
          absent: 0,
          excused: 0,
          total: 0,
        });
        return newMap;
      });

      setShowSessionDialog(false);
      toast.success("진행 일정이 등록되었습니다.");
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("일정 등록에 실패했습니다.");
    }
  }

  async function handleCreateSessionAndAttendance() {
    if (!sessionForm.date) {
      toast.error("날짜를 입력해주세요.");
      return;
    }

    try {
      const newSession = await createActivitySession({
        activityId,
        sessionNumber: sessionForm.sessionNumber,
        date: sessionForm.date,
        description: sessionForm.description,
      });

      setSessions((prev) =>
        [...prev, newSession].sort((a, b) => a.sessionNumber - b.sessionNumber),
      );

      // Move to step 2 for attendance input
      setSelectedSession(newSession);
      setAttendanceData({
        present: new Set(),
        absent: new Set(),
        excused: new Set(),
      });
      setSelectedParticipants(new Set());
      setIsEditingAttendance(false);
      setSessionDialogStep(2);
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("일정 등록에 실패했습니다.");
    }
  }

  async function handleDeleteSession() {
    if (!deleteSessionId) return;
    try {
      await deleteActivitySession(deleteSessionId);
      setSessions((prev) => prev.filter((s) => s.id !== deleteSessionId));
      toast.success("회차가 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("회차 삭제에 실패했습니다.");
    } finally {
      setDeleteSessionId(null);
    }
  }

  // ========================
  // ATTENDANCE HANDLERS
  // ========================

  async function handleOpenAttendanceDialog(
    session: ActivitySessionResponseDto,
  ) {
    setSelectedSession(session);
    setAttendanceData({
      present: new Set(),
      absent: new Set(),
      excused: new Set(),
    });
    setSelectedParticipants(new Set());
    setAttendanceSearchQuery("");
    setAttendanceStatusTab("present");

    // Check if attendance exists for this session
    const status = sessionAttendanceStatus.get(session.id);
    const hasAttendance = status && status.total > 0;
    setIsEditingAttendance(!!hasAttendance);

    if (hasAttendance) {
      // Load existing attendance data
      try {
        const existingAttendances = await getAttendancesBySessionId(session.id);
        const newData = {
          present: new Set<string>(),
          absent: new Set<string>(),
          excused: new Set<string>(),
        };

        existingAttendances.forEach((att) => {
          if (att.status === "PRESENT") {
            newData.present.add(att.participant.id);
          } else if (att.status === "ABSENT") {
            newData.absent.add(att.participant.id);
          } else if (att.status === "EXCUSED") {
            newData.excused.add(att.participant.id);
          }
        });

        setAttendanceData(newData);
      } catch (error) {
        console.error("Failed to load attendance:", error);
      }
    }

    setShowAttendanceDialog(true);
  }

  function handleToggleParticipantSelection(participantId: string) {
    setSelectedParticipants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  }

  function handleBulkAssignStatus(status: "present" | "absent" | "excused") {
    if (selectedParticipants.size === 0) return;

    setAttendanceData((prev) => {
      const newData = {
        present: new Set(prev.present),
        absent: new Set(prev.absent),
        excused: new Set(prev.excused),
      };

      selectedParticipants.forEach((id) => {
        // Remove from all
        newData.present.delete(id);
        newData.absent.delete(id);
        newData.excused.delete(id);
        // Add to target
        newData[status].add(id);
      });

      return newData;
    });

    setSelectedParticipants(new Set());
  }

  function handleMoveParticipant(
    participantId: string,
    toStatus: "present" | "absent" | "excused",
  ) {
    setAttendanceData((prev) => {
      const newData = {
        present: new Set(prev.present),
        absent: new Set(prev.absent),
        excused: new Set(prev.excused),
      };

      // Remove from all
      newData.present.delete(participantId);
      newData.absent.delete(participantId);
      newData.excused.delete(participantId);

      // Add to target
      newData[toStatus].add(participantId);

      return newData;
    });
  }

  function handleRemoveParticipantFromStatus(participantId: string) {
    setAttendanceData((prev) => ({
      present: new Set([...prev.present].filter((id) => id !== participantId)),
      absent: new Set([...prev.absent].filter((id) => id !== participantId)),
      excused: new Set([...prev.excused].filter((id) => id !== participantId)),
    }));
  }

  function handleSelectAllPresent() {
    const approvedParticipants = participants.filter(
      (p) => p.status === "APPROVED",
    );

    if (approvedParticipants.length === 0) return;

    setAttendanceData({
      present: new Set(approvedParticipants.map((p) => p.id)),
      absent: new Set(),
      excused: new Set(),
    });
  }

  function handleClearAttendanceSelection() {
    setAttendanceData({
      present: new Set(),
      absent: new Set(),
      excused: new Set(),
    });
  }

  async function handleSubmitAttendance() {
    if (!selectedSession) return;

    const totalAssigned =
      attendanceData.present.size +
      attendanceData.absent.size +
      attendanceData.excused.size;

    try {
      if (isEditingAttendance) {
        // Update existing attendance records
        await bulkUpdateAttendances({
          sessionId: selectedSession.id,
          presentParticipantIds: Array.from(attendanceData.present),
          absentParticipantIds: Array.from(attendanceData.absent),
          excusedParticipantIds: Array.from(attendanceData.excused),
        });
      } else {
        await bulkCreateAttendances({
          sessionId: selectedSession.id,
          presentParticipantIds: Array.from(attendanceData.present),
          absentParticipantIds: Array.from(attendanceData.absent),
          excusedParticipantIds: Array.from(attendanceData.excused),
        });
      }

      // Update session attendance status
      setSessionAttendanceStatus((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedSession.id, {
          present: attendanceData.present.size,
          absent: attendanceData.absent.size,
          excused: attendanceData.excused.size,
          total: totalAssigned,
        });
        return newMap;
      });

      setShowAttendanceDialog(false);
      setShowSessionDialog(false);
      setSessionDialogStep(1);
      toast.success("출석이 저장되었습니다.");

      // Reload attendance stats after saving
      await loadAttendanceStats();
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error("출석 저장에 실패했습니다.");
    }
  }

  function handleSkipAttendanceInput() {
    setShowSessionDialog(false);
    setSessionDialogStep(1);
    toast.success("진행 일정이 등록되었습니다.");
  }

  // ========================
  // COMPLETION HANDLERS
  // ========================

  function handleOpenCompletionDialog(
    participant: ActivityParticipantResponse,
  ) {
    setCompletionDialog({ open: true, participant });
  }

  async function handleConfirmCompletion() {
    if (!completionDialog.participant) return;

    try {
      await updateActivityParticipantCompleted(completionDialog.participant.id);

      // Update local state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === completionDialog.participant!.id
            ? { ...p, completed: true }
            : p,
        ),
      );

      setCompletionDialog({ open: false, participant: null });
      toast.success("수료 처리되었습니다.");
    } catch (error) {
      console.error("Failed to mark as completed:", error);
      toast.error("수료 처리에 실패했습니다.");
    }
  }

  // ========================
  // ATTENDANCE STATS CALCULATION
  // ========================

  function getAttendanceStats() {
    return participants
      .filter((p) => p.status === "APPROVED")
      .map((p) => {
        const stats = attendanceStats.get(p.id) || {
          presentCount: 0,
          absentCount: 0,
          excusedCount: 0,
        };

        const totalSessions = sessions.length;
        const attendedCount = stats.presentCount + stats.excusedCount;
        const attendanceRate =
          totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;

        return {
          participant: p,
          totalSessions,
          presentCount: stats.presentCount,
          absentCount: stats.absentCount,
          excusedCount: stats.excusedCount,
          attendanceRate,
        };
      });
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <p className="text-muted-foreground">활동을 찾을 수 없습니다.</p>
        <Button onClick={handleBackToList} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b pb-6">
        <Button
          onClick={handleBackToList}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {activity.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant={getActivityStatusVariant(activity.status)}>
                {getActivityStatusLabel(activity.status)}
              </Badge>
              <span>•</span>
              <span>{activity.activityType.name}</span>
              <span>•</span>
              <span>{activity.quarter.name}</span>
              <span>•</span>
              <span>
                {formatDate(activity.startDate)} ~{" "}
                {formatDate(activity.endDate)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              수정
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="participants">신청 내역</TabsTrigger>
          <TabsTrigger value="attendance" onClick={loadSessions}>
            활동 진행 관리
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 기본 정보 */}
        <TabsContent value="info" className="space-y-4">
          {/* Activity Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>활동 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
                <div className="text-sm font-medium text-muted-foreground">
                  활동명
                </div>
                <div className="text-sm">{activity.title}</div>

                <div className="text-sm font-medium text-muted-foreground">
                  설명
                </div>
                <div className="text-sm">
                  {activity.description || "설명 없음"}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  유형
                </div>
                <div className="text-sm">{activity.activityType.name}</div>

                <div className="text-sm font-medium text-muted-foreground">
                  상태
                </div>
                <div>
                  <Badge variant={getActivityStatusVariant(activity.status)}>
                    {getActivityStatusLabel(activity.status)}
                  </Badge>
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  분기
                </div>
                <div className="text-sm">{activity.quarter.name}</div>

                <div className="text-sm font-medium text-muted-foreground">
                  기간
                </div>
                <div className="text-sm">
                  {formatDate(activity.startDate)} ~{" "}
                  {formatDate(activity.endDate)}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  담당자
                </div>
                <div className="text-sm">
                  {activity.assignee?.name || "미지정"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>메타 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
                <div className="text-sm font-medium text-muted-foreground">
                  생성일
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(activity.createdAt)}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  수정일
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(activity.modifiedAt)}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  생성자
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.createdBy || "알 수 없음"}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  수정자
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.modifiedBy || "알 수 없음"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 신청 내역 */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>신청 내역</CardTitle>
                <span className="text-sm text-muted-foreground">
                  총 {filteredParticipants.length}건
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-35 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="신청">신청</SelectItem>
                    <SelectItem value="승인">승인</SelectItem>
                    <SelectItem value="미승인">미승인</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="이름 또는 학번 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs bg-white"
                />

                {(statusFilter !== "전체" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("전체");
                      setSearchQuery("");
                    }}
                  >
                    필터 초기화
                  </Button>
                )}
              </div>

              {/* Table */}
              {filteredParticipants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserIcon className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">신청 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredParticipants.length > 0 &&
                              selectedIds.size === filteredParticipants.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-30">이름</TableHead>
                        <TableHead className="w-30">학번</TableHead>
                        <TableHead className="w-60">이메일</TableHead>
                        <TableHead className="w-25 text-center">
                          신청 상태
                        </TableHead>
                        <TableHead className="w-30 text-right">
                          신청일
                        </TableHead>
                        <TableHead className="w-40 text-center">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.map((participant) => {
                        const isUpdating = updatingIds.has(participant.id);
                        return (
                          <TableRow key={participant.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(participant.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectOne(
                                    participant.id,
                                    checked as boolean,
                                  )
                                }
                                disabled={isUpdating}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {participant.user?.name || "-"}
                            </TableCell>
                            <TableCell>
                              {participant.user?.studentId || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {participant.user?.email || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={getParticipantStatusVariant(
                                  participant.status,
                                )}
                              >
                                {getParticipantStatusLabel(participant.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {formatDate(participant.createdAt)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Select
                                  value={participant.status}
                                  onValueChange={(value) =>
                                    handleStatusChange(participant.id, value)
                                  }
                                  disabled={isUpdating}
                                >
                                  <SelectTrigger className="h-8 w-24 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="APPLIED">
                                      신청
                                    </SelectItem>
                                    <SelectItem value="APPROVED">
                                      승인
                                    </SelectItem>
                                    <SelectItem value="REJECTED">
                                      미승인
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {participant.user && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) =>
                                      handleMemberClick(participant.user!.id, e)
                                    }
                                    className="h-8 px-2 text-xs"
                                  >
                                    상세
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Bulk update toolbar */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="px-3 py-2 border border-dashed border-gray-300 rounded-md">
                    <span className="text-sm font-medium">
                      선택 {selectedIds.size}건
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={bulkStatus} onValueChange={setBulkStatus}>
                      <SelectTrigger className="w-32 bg-white">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVED">승인</SelectItem>
                        <SelectItem value="REJECTED">미승인</SelectItem>
                        <SelectItem value="APPLIED">신청</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleBulkUpdateClick}
                      disabled={!bulkStatus || bulkUpdating}
                    >
                      일괄 적용
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: 활동 진행 관리 */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Section A: 진행 일정 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>진행 일정</CardTitle>
                <Button size="sm" onClick={handleOpenSessionDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  일정 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    아직 등록된 진행 일정이 없습니다.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">회차</TableHead>
                      <TableHead className="w-32">날짜</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead className="w-48">출석 현황</TableHead>
                      <TableHead className="text-center w-40">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const status = sessionAttendanceStatus.get(session.id);
                      const hasAttendance = status && status.total > 0;

                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {session.sessionNumber}회차
                          </TableCell>
                          <TableCell>{formatDate(session.date)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {session.description || "-"}
                          </TableCell>
                          <TableCell>
                            {hasAttendance ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-xs">
                                  입력됨
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  출석 {status!.present} / 결석 {status!.absent}{" "}
                                  / 사유 {status!.excused}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                미입력
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleOpenAttendanceDialog(session)
                                }
                              >
                                {hasAttendance ? "출석 수정" : "출석 입력"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteSessionId(session.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Section B: 출석 현황 */}
          <Card>
            <CardHeader>
              <CardTitle>출석 현황</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.filter((p) => p.status === "APPROVED").length ===
              0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserIcon className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    승인된 참여자가 없습니다.
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">이름</TableHead>
                        <TableHead className="w-32">학번</TableHead>
                        <TableHead className="text-center w-24">
                          출석률
                        </TableHead>
                        <TableHead className="text-center w-32">
                          출석/전체
                        </TableHead>
                        <TableHead className="text-center w-32">수료</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants
                        .filter((p) => p.status === "APPROVED")
                        .map((participant) => {
                          const stats = getAttendanceStats().find(
                            (s) => s.participant.id === participant.id,
                          );
                          return (
                            <TableRow key={participant.id}>
                              <TableCell className="font-medium">
                                {participant.user?.name || "-"}
                              </TableCell>
                              <TableCell>
                                {participant.user?.studentId || "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {stats
                                  ? `${Math.round(stats.attendanceRate)}%`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {stats
                                  ? `${stats.presentCount}/${stats.totalSessions}`
                                  : `0/${sessions.length}`}
                              </TableCell>
                              <TableCell className="text-center">
                                {participant.completed ? (
                                  <Badge variant="default">수료</Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleOpenCompletionDialog(participant)
                                    }
                                  >
                                    수료 처리
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground mt-2">
                    출석률은 (출석+사유) / 전체 회차 기준입니다.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Create Dialog - 2 Step Flow */}
      <Dialog
        open={showSessionDialog}
        onOpenChange={(open) => {
          setShowSessionDialog(open);
          if (!open) {
            setSessionDialogStep(1);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          {sessionDialogStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>진행 일정 등록</DialogTitle>
                <DialogDescription>
                  새로운 활동 진행 일정을 등록합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">회차</label>
                  <Input
                    type="number"
                    value={sessionForm.sessionNumber}
                    onChange={(e) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        sessionNumber: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">날짜</label>
                  <Input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">설명 (선택)</label>
                  <Textarea
                    value={sessionForm.description}
                    onChange={(e) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="진행 일정에 대한 설명을 입력하세요"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSessionDialog(false)}
                >
                  취소
                </Button>
                <Button variant="outline" onClick={handleCreateSessionOnly}>
                  일정만 생성
                </Button>
                <Button onClick={handleCreateSessionAndAttendance}>
                  다음: 출석 입력
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>출석 입력 (선택)</DialogTitle>
                <DialogDescription>
                  {selectedSession?.sessionNumber}회차의 출석을 입력하거나
                  나중에 입력할 수 있습니다.
                </DialogDescription>
              </DialogHeader>
              <AttendanceInputContent
                participants={participants}
                attendanceData={attendanceData}
                selectedParticipants={selectedParticipants}
                attendanceSearchQuery={attendanceSearchQuery}
                attendanceStatusTab={attendanceStatusTab}
                isEditingAttendance={isEditingAttendance}
                onToggleSelection={handleToggleParticipantSelection}
                onBulkAssignStatus={handleBulkAssignStatus}
                onMoveParticipant={handleMoveParticipant}
                onRemoveParticipant={handleRemoveParticipantFromStatus}
                onSearchChange={setAttendanceSearchQuery}
                onTabChange={setAttendanceStatusTab}
                onSelectAll={handleSelectAllPresent}
                onClear={handleClearAttendanceSelection}
              />
              <DialogFooter className="border-t pt-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    총{" "}
                    {participants.filter((p) => p.status === "APPROVED").length}
                    명 · 출석 {attendanceData.present.size} / 결석{" "}
                    {attendanceData.absent.size} / 사유{" "}
                    {attendanceData.excused.size}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSkipAttendanceInput}
                    >
                      나중에 입력
                    </Button>
                    <Button onClick={handleSubmitAttendance}>저장하기</Button>
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Standalone Attendance Input Dialog */}
      <Dialog
        open={showAttendanceDialog}
        onOpenChange={setShowAttendanceDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditingAttendance ? "출석 수정" : "출석 입력"}
            </DialogTitle>
            <DialogDescription>
              {selectedSession?.sessionNumber}회차 (
              {selectedSession && formatDate(selectedSession.date)})
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <AttendanceInputContent
              participants={participants}
              attendanceData={attendanceData}
              selectedParticipants={selectedParticipants}
              attendanceSearchQuery={attendanceSearchQuery}
              attendanceStatusTab={attendanceStatusTab}
              isEditingAttendance={isEditingAttendance}
              onToggleSelection={handleToggleParticipantSelection}
              onBulkAssignStatus={handleBulkAssignStatus}
              onMoveParticipant={handleMoveParticipant}
              onRemoveParticipant={handleRemoveParticipantFromStatus}
              onSearchChange={setAttendanceSearchQuery}
              onTabChange={setAttendanceStatusTab}
              onSelectAll={handleSelectAllPresent}
              onClear={handleClearAttendanceSelection}
            />
          </div>
          <DialogFooter className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                총 {participants.filter((p) => p.status === "APPROVED").length}
                명 · 출석 {attendanceData.present.size} / 결석{" "}
                {attendanceData.absent.size} / 사유{" "}
                {attendanceData.excused.size}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAttendanceDialog(false)}
                >
                  취소
                </Button>
                <Button onClick={handleSubmitAttendance}>저장하기</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Completion Confirmation Dialog */}
      <AlertDialog
        open={completionDialog.open}
        onOpenChange={(open) =>
          setCompletionDialog({ open, participant: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수료 처리할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {completionDialog.participant?.user?.name} 학회원의 활동 상태가
              수료로 변경됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCompletion}>
              처리하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Session Confirmation Dialog */}
      <AlertDialog
        open={!!deleteSessionId}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회차를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Confirmation Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상태를 일괄 변경할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedIds.size}건의 신청 상태가 변경됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkUpdating}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkUpdateConfirm}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? "변경 중..." : "변경"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>활동 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 활동을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
