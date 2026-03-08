"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User as UserIcon,
  Plus,
  Calendar,
  Info,
  Tag,
  CalendarDays,
  UserRound,
  MoreVertical,
  PlusSquare,
  SquarePlus,
  X,
  Search,
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
import { DeleteConfirmDialog } from "@/components/custom/common/delete-confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";
import { ActivityStatusBadge } from "@/components/custom/activity/activity-status-badge";
import { ParticipantStatusBadge } from "@/components/custom/participant/partipant-status-badge";

const PARTICIPANT_STATUS_OPTIONS = [
  { value: "APPLIED", label: "신청" },
  { value: "APPROVED", label: "참여 확정" },
  { value: "REJECTED", label: "거절" },
];
import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ParticipantStatusSelector } from "@/components/custom/participant/participant-status-selector";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DatePicker } from "@/components/ui/date-picker";

function getActivityStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    CREATED: "준비 중",
    OPEN: "모집 중",
    ONGOING: "진행 중",
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
    APPROVED: "참여 확정",
    REJECTED: "거절",
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
// INFO ROW
// ========================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}

// ========================
// LOADING SKELETON
// ========================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-24" />

      {/* 기본 정보 Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="divide-y">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <Skeleton className="h-4 w-4 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
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

  // Bulk completion states
  const [selectedCompletionIds, setSelectedCompletionIds] = useState<
    Set<string>
  >(new Set());
  const [showBulkCompletionDialog, setShowBulkCompletionDialog] =
    useState(false);
  const [bulkCompletionUpdating, setBulkCompletionUpdating] = useState(false);

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

  // Session selection states
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    new Set(),
  );
  const [showBulkSessionDeleteDialog, setShowBulkSessionDeleteDialog] =
    useState(false);
  const [bulkSessionDeleting, setBulkSessionDeleting] = useState(false);

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
      } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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

  // Auto-load sessions once main data is ready
  useEffect(() => {
    if (!loading) {
      loadSessions();
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEdit() {
    router.push(`/manage/activities/${activityId}/edit`);
  }

  async function handleDelete() {
    if (deleting) return;

    setDeleting(true);
    try {
      await deleteActivity(activityId);
      router.push("/manage/activities");
    } catch (error: any) {
      console.error("Failed to delete activity:", error);
      toast.error(error.response?.data || "활동 삭제에 실패했습니다.");
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

  // Session selection handlers
  function handleSelectAllSessions(checked: boolean) {
    if (checked) {
      const allIds = new Set(sessions.map((s) => s.id));
      setSelectedSessionIds(allIds);
    } else {
      setSelectedSessionIds(new Set());
    }
  }

  function handleSelectOneSession(id: string, checked: boolean) {
    const newSelected = new Set(selectedSessionIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedSessionIds(newSelected);
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
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error(error.response?.data || "상태 변경에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(participantId);
        return next;
      });
    }
  }

  // Bulk status update
  function handleBulkStatusSelect(newStatus: string) {
    if (selectedIds.size === 0 || !newStatus) return;
    setBulkStatus(newStatus);
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Failed to create session:", error);
      toast.error(error.response?.data || "일정 등록에 실패했습니다.");
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
    } catch (error: any) {
      console.error("Failed to create session:", error);
      toast.error(error.response?.data || "일정 등록에 실패했습니다.");
    }
  }

  async function handleDeleteSession() {
    if (!deleteSessionId) return;
    try {
      await deleteActivitySession(deleteSessionId);
      setSessions((prev) => prev.filter((s) => s.id !== deleteSessionId));
      toast.success("회차가 삭제되었습니다.");
    } catch (error: any) {
      console.error("Failed to delete session:", error);
      toast.error(error.response?.data || "회차 삭제에 실패했습니다.");
    } finally {
      setDeleteSessionId(null);
    }
  }

  async function handleBulkDeleteSessions() {
    setBulkSessionDeleting(true);
    const ids = Array.from(selectedSessionIds);
    const results = await runWithConcurrency(ids, 5, (id) =>
      deleteActivitySession(id),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    setSessions((prev) => prev.filter((s) => !selectedSessionIds.has(s.id)));

    setSelectedSessionIds(new Set());
    setShowBulkSessionDeleteDialog(false);
    setBulkSessionDeleting(false);

    if (failureCount === 0) {
      toast.success(`${successCount}개 회차 삭제 완료`);
    } else {
      toast.error(`${successCount}개 완료, ${failureCount}개 실패`);
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
      } catch (error: any) {
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
    } catch (error: any) {
      console.error("Failed to save attendance:", error);
      toast.error(error.response?.data || "출석 저장에 실패했습니다.");
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
    } catch (error: any) {
      console.error("Failed to mark as completed:", error);
      toast.error(error.response?.data || "수료 처리에 실패했습니다.");
    }
  }

  // ========================
  // BULK COMPLETION HANDLERS
  // ========================

  function handleSelectAllCompletion(checked: boolean) {
    const completableParticipants = participants.filter(
      (p) => p.status === "APPROVED" && !p.completed,
    );
    if (checked) {
      setSelectedCompletionIds(
        new Set(completableParticipants.map((p) => p.id)),
      );
    } else {
      setSelectedCompletionIds(new Set());
    }
  }

  function handleSelectOneCompletion(id: string, checked: boolean) {
    const next = new Set(selectedCompletionIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedCompletionIds(next);
  }

  async function handleBulkCompletionConfirm() {
    setBulkCompletionUpdating(true);
    const ids = Array.from(selectedCompletionIds);
    const results = await runWithConcurrency(ids, 5, (id) =>
      updateActivityParticipantCompleted(id),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    setParticipants((prev) =>
      prev.map((p) =>
        selectedCompletionIds.has(p.id) ? { ...p, completed: true } : p,
      ),
    );

    setSelectedCompletionIds(new Set());
    setShowBulkCompletionDialog(false);
    setBulkCompletionUpdating(false);

    if (failureCount === 0) {
      toast.success(`${successCount}명 수료 처리 완료`);
    } else {
      toast.error(`${successCount}명 완료, ${failureCount}명 실패`);
    }
  }

  // ========================
  // ATTENDANCE STATS CALCULATION
  // ========================

  function getAttendanceStats() {
    let approvedParticipants = participants.filter(
      (p) => p.status === "APPROVED",
    );

    // Apply search filter
    if (attendanceSearchQuery.trim()) {
      const query = attendanceSearchQuery.trim().toLowerCase();
      approvedParticipants = approvedParticipants.filter((p) => {
        const name = p.user?.name?.toLowerCase() || "";
        const studentId = p.user?.studentId?.toLowerCase() || "";
        return name.includes(query) || studentId.includes(query);
      });
    }

    return approvedParticipants.map((p) => {
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
        <p className="text-muted-foreground">활동을 찾을 수 없습니다</p>
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
      <div className="space-y-3">
        <Button
          onClick={() => router.push("/manage/activities")}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>

        <h1 className="text-xl font-bold tracking-tight">{activity.title}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <ActivityTypeBadge activityType={activity.activityType} />
          <span className="text-sm text-muted-foreground">·</span>
          <ActivityStatusBadge status={activity.status} />
          <span className="text-sm text-muted-foreground">·</span>
          {activity.quarter && (
            <span className="text-xs text-muted-foreground">
              {activity.quarter.name}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" className="px-4 py-2">
            기본 정보
          </TabsTrigger>
          <TabsTrigger value="applications" className="px-4 py-2">
            신청 관리
          </TabsTrigger>
          <TabsTrigger value="schedule" className="px-4 py-2">
            일정 관리
          </TabsTrigger>
          <TabsTrigger value="attendance" className="px-4 py-2">
            출석 관리
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 기본 정보 */}
        <TabsContent value="info" className="space-y-4">
          {/* 기본 정보 Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-start">
                <CardTitle className="flex items-center gap-2">
                  기본 정보
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y">
                <InfoRow
                  icon={<Info className="h-4 w-4" />}
                  label="제목"
                  value={activity.title}
                />
                <InfoRow
                  icon={<Info className="h-4 w-4" />}
                  label="설명"
                  value={
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {activity.description || "—"}
                    </div>
                  }
                />
                <InfoRow
                  icon={<Tag className="h-4 w-4" />}
                  label="유형"
                  value={activity.activityType.name}
                />
                <InfoRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="분기"
                  value={activity.quarter.name}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="기간"
                  value={`${formatDate(activity.startDate)} ~ ${formatDate(activity.endDate)}`}
                />
                <InfoRow
                  icon={<UserRound className="h-4 w-4" />}
                  label="담당자"
                  value={activity.assignee?.name || "미지정"}
                />
              </div>
            </CardContent>
          </Card>

          {/* 메타 정보 Card */}
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
        <TabsContent value="applications" className="space-y-4">
          {/* 신청 내역 Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                신청 내역
                <span className="text-sm text-muted-foreground">
                  총 {filteredParticipants.length}건
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters / Bulk Toolbar Toggle */}
              {selectedIds.size > 0 ? (
                <div className="flex items-center gap-3 h-9">
                  <span className="text-xs text-muted-foreground font-medium">
                    {selectedIds.size}개 선택됨
                  </span>
                  <ParticipantStatusSelector
                    value={bulkStatus}
                    onChange={handleBulkStatusSelect}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 ml-auto"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    선택 해제
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative w-60">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      placeholder="이름 또는 학번 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-35 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <SelectItem value="신청">신청</SelectItem>
                      <SelectItem value="참여 확정">참여 확정</SelectItem>
                      <SelectItem value="거절">거절</SelectItem>
                    </SelectContent>
                  </Select>

                  {(statusFilter !== "전체" || searchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("전체");
                        setSearchQuery("");
                      }}
                      className="h-9 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      초기화
                    </Button>
                  )}
                </div>
              )}

              {/* Table */}
              {filteredParticipants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserIcon className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">신청 내역이 없습니다</p>
                </div>
              ) : (
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
                      <TableHead className="w-25 text-center">상태</TableHead>
                      <TableHead className="w-30 text-center">신청일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant) => {
                      const isUpdating = updatingIds.has(participant.id);
                      return (
                        <TableRow
                          key={participant.id}
                          onClick={(e) =>
                            handleMemberClick(participant.user!.id, e)
                          }
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
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
                            <ParticipantStatusBadge
                              status={participant.status}
                            />
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground text-sm">
                            {formatDate(participant.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule" className="space-y-4">
          {/* 진행 일정 Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>진행 일정</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenSessionDialog}
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-xs">일정 생성</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bulk Toolbar for Sessions */}
              <div className="min-h-9">
                {selectedSessionIds.size > 0 && (
                  <div className="flex items-center gap-3 h-9">
                    <span className="text-xs text-muted-foreground font-medium">
                      {selectedSessionIds.size}개 선택됨
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs h-7"
                      onClick={() => setShowBulkSessionDeleteDialog(true)}
                    >
                      선택 삭제
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 ml-auto"
                      onClick={() => setSelectedSessionIds(new Set())}
                    >
                      선택 해제
                    </Button>
                  </div>
                )}
              </div>
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
                    아직 등록된 진행 일정이 없습니다
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            sessions.length > 0 &&
                            selectedSessionIds.size === sessions.length
                          }
                          onCheckedChange={handleSelectAllSessions}
                        />
                      </TableHead>
                      <TableHead className="w-20">회차</TableHead>
                      <TableHead className="w-32">날짜</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead className="w-48">출석 현황</TableHead>
                      <TableHead className="w-25">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const status = sessionAttendanceStatus.get(session.id);
                      const hasAttendance = status && status.total > 0;

                      return (
                        <TableRow
                          key={session.id}
                          className="cursor-pointer"
                          onClick={() => handleOpenAttendanceDialog(session)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedSessionIds.has(session.id)}
                              onCheckedChange={(checked) =>
                                handleSelectOneSession(
                                  session.id,
                                  checked as boolean,
                                )
                              }
                            />
                          </TableCell>
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
                                  / 공결 {status!.excused}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                미입력
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteSessionId(session.id);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          {/* Section B: 출석 현황 */}
          <Card>
            <CardHeader>
              <CardTitle>출석 현황</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCompletionIds.size > 0 ? (
                <div className="flex items-center gap-3 h-9">
                  <span className="text-xs text-muted-foreground font-medium">
                    {selectedCompletionIds.size}명 선택됨
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => setShowBulkCompletionDialog(true)}
                    disabled={bulkCompletionUpdating}
                  >
                    수료 처리
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 ml-auto"
                    onClick={() => setSelectedCompletionIds(new Set())}
                  >
                    선택 해제
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative w-60">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="이름 또는 학번 검색..."
                      value={attendanceSearchQuery}
                      onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {attendanceSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttendanceSearchQuery("")}
                      className="h-9 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      초기화
                    </Button>
                  )}
                </div>
              )}

              {participants.filter((p) => p.status === "APPROVED").length ===
              0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserIcon className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    승인된 참여자가 없습니다
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              participants.filter(
                                (p) => p.status === "APPROVED" && !p.completed,
                              ).length > 0 &&
                              selectedCompletionIds.size ===
                                participants.filter(
                                  (p) =>
                                    p.status === "APPROVED" && !p.completed,
                                ).length
                            }
                            onCheckedChange={handleSelectAllCompletion}
                          />
                        </TableHead>
                        <TableHead className="w-32">이름</TableHead>
                        <TableHead className="w-32">학번</TableHead>
                        <TableHead className="text-center w-24">
                          출석률
                        </TableHead>
                        <TableHead className="text-center w-32">
                          출석/전체
                        </TableHead>
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
                              <TableCell>
                                {!participant.completed && (
                                  <Checkbox
                                    checked={selectedCompletionIds.has(
                                      participant.id,
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleSelectOneCompletion(
                                        participant.id,
                                        checked as boolean,
                                      )
                                    }
                                  />
                                )}
                              </TableCell>
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
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>

                  <p className="text-xs text-muted-foreground mt-2">
                    출석률은 (출석+공결) / 전체 회차 기준입니다.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleEdit}>
          <Pencil className="h-3 w-3" />
          <span className="text-xs">수정</span>
        </Button>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-3 w-3" />
          <span className="text-xs">삭제</span>
        </Button>
      </div>

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
        <DialogContent className="max-w-4xl h-[70vh] flex flex-col">
          {sessionDialogStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>진행 일정 등록</DialogTitle>
                <DialogDescription>
                  새로운 활동 진행 일정을 등록합니다
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
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

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">날짜</label>
                    <DatePicker
                      value={sessionForm.date}
                      onChange={(value) =>
                        setSessionForm((prev) => ({
                          ...prev,
                          date: value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">설명</label>
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
                <DialogTitle>출석 입력</DialogTitle>
                <DialogDescription>
                  {sessionForm.sessionNumber}회차 (
                  {formatDate(sessionForm.date)})
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-hidden">
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
              <DialogFooter className="pt-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    총{" "}
                    {participants.filter((p) => p.status === "APPROVED").length}
                    명 · 출석 {attendanceData.present.size} / 결석{" "}
                    {attendanceData.absent.size} / 공결{" "}
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
        <DialogContent className="max-w-4xl h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditingAttendance ? "출석 수정" : "출석 입력"}
            </DialogTitle>
            <DialogDescription>
              {selectedSession?.sessionNumber}회차 (
              {selectedSession && formatDate(selectedSession.date)})
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
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
          <DialogFooter className="pt-4 mt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                총 {participants.filter((p) => p.status === "APPROVED").length}
                명 · 출석 {attendanceData.present.size} / 결석{" "}
                {attendanceData.absent.size} / 공결{" "}
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

      <DeleteConfirmDialog
        open={!!deleteSessionId}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
        itemValue="회차"
        onConfirm={handleDeleteSession}
      />

      {/* Bulk Session Delete Dialog */}
      <AlertDialog
        open={showBulkSessionDeleteDialog}
        onOpenChange={setShowBulkSessionDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회차 일괄 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 <strong>{selectedSessionIds.size}개</strong> 회차를
              삭제하시겠습니까? 해당 회차의 출석 기록도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkSessionDeleting}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteSessions}
              disabled={bulkSessionDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkSessionDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Confirmation Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택한 신청 상태를 변경할까요?</AlertDialogTitle>
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

      {/* Bulk Completion Confirmation Dialog */}
      <AlertDialog
        open={showBulkCompletionDialog}
        onOpenChange={setShowBulkCompletionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 수료 처리할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedCompletionIds.size}명을 수료 처리합니다. 이 작업은
              되돌릴 수 없습니다
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkCompletionUpdating}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCompletionConfirm}
              disabled={bulkCompletionUpdating}
            >
              {bulkCompletionUpdating ? "처리 중..." : "수료 처리"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        itemValue={activity.title}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
