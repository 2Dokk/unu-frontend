"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  ExternalLink,
  UserPlus,
  X,
  MessageCircle,
  Search,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FileText,
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
import { getLectureMaterialsByActivity } from "@/lib/api/lecture-material";
import { LectureMaterial } from "@/lib/interfaces/lecture-material";
import { WeeklyMaterials } from "@/components/custom/activity/weekly-materials";
import { getActivityNotices } from "@/lib/api/activity-notice";
import { ActivityNotice } from "@/lib/interfaces/activity-notice";
import { ActivityNotices } from "@/components/custom/activity/activity-notices";
import {
  getActivityParticipantsByActivityId,
  updateActivityParticipantStatus,
  updateActivityParticipantCompleted,
  createActivityParticipant,
  getActivityParticipantRefundAccounts,
} from "@/lib/api/activity-participant";
import { getAllUsers } from "@/lib/api/user";
import { UserResponseDto } from "@/lib/interfaces/auth";
import {
  getActivitySessionsByActivityId,
  createActivitySession,
  createActivitySessionsBulk,
  deleteActivitySession,
} from "@/lib/api/activity-session";
import {
  getAttendancesBySessionId,
  getAttendanceStatsByParticipantId,
  bulkUpdateAttendances,
} from "@/lib/api/attendance";
import { ActivityResponse } from "@/lib/interfaces/activity";
import {
  ActivityParticipantRefundAccount,
  ActivityParticipantResponse,
} from "@/lib/interfaces/activity-participant";
import{
  supportsDiscordLink
} from "@/lib/constants/discord-link";
import { 
  ActivitySessionResponseDto,
  ActivitySessionWeekday,
} from "@/lib/interfaces/activity-session";
import { AttendanceResponseDto } from "@/lib/interfaces/attendance";
import { AttendanceInputContent } from "@/components/custom/attendance/attendance-input-content";
import { formatDate, formatDateTime } from "@/lib/utils/date-utils";
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";
import { ActivityStatusBadge } from "@/components/custom/activity/activity-status-badge";
import { activityDisplayStatus } from "@/lib/utils/activity-recruitment";
import { ParticipantStatusBadge } from "@/components/custom/participant/partipant-status-badge";
import {
  isOperationPlanUrl,
  operationPlanLabel,
} from "@/lib/constants/operation-plan";

const PARTICIPANT_STATUS_OPTIONS = [
  { value: "APPLIED", label: "신청 완료" },
  { value: "APPROVED", label: "참여 확정" },
  { value: "REJECTED", label: "신청 반려" },
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
import { useAuth } from "@/lib/contexts/AuthContext";

const WEEKDAY_OPTIONS: { value: ActivitySessionWeekday; label: string }[] = [
  { value: "MONDAY", label: "월" },
  { value: "TUESDAY", label: "화" },
  { value: "WEDNESDAY", label: "수" },
  { value: "THURSDAY", label: "목" },
  { value: "FRIDAY", label: "금" },
  { value: "SATURDAY", label: "토" },
  { value: "SUNDAY", label: "일" },
];

const SESSIONS_PER_PAGE = 10;

const WEEKDAY_BY_INDEX: ActivitySessionWeekday[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    APPLIED: "신청 완료",
    APPROVED: "참여 확정",
    REJECTED: "신청 반려",
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
  const searchParams = useSearchParams();
  const activityId = params.id as string;
  const returnToMyActivities = searchParams.get("from") === "home";
  const { userId, roles, isLoading: authLoading } = useAuth();
  const canAdministerActivity = roles.some(
    (role) => role === "ADMIN" || role === "MANAGER",
  );

  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const isActivityAssignee = activity?.assignee?.id === userId;
  const canReviewApplications = canAdministerActivity || isActivityAssignee;
  const [participants, setParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [filteredParticipants, setFilteredParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [refundAccounts, setRefundAccounts] = useState<
    ActivityParticipantRefundAccount[]
  >([]);
  const [lectureMaterials, setLectureMaterials] = useState<LectureMaterial[]>([]);
  const [activityNotices, setActivityNotices] = useState<ActivityNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 멤버 직접 추가 states
  const [allUsers, setAllUsers] = useState<UserResponseDto[]>([]);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Session & Attendance states
  const [sessions, setSessions] = useState<ActivitySessionResponseDto[]>([]);
  const [sessionPage, setSessionPage] = useState(1);
  const [activeTab, setActiveTab] = useState("info");
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
  const [showBulkSessionDialog, setShowBulkSessionDialog] = useState(false);
  const [bulkSessionCreating, setBulkSessionCreating] = useState(false);
  const [sessionDialogStep, setSessionDialogStep] = useState<1 | 2>(1);
  const [sessionForm, setSessionForm] = useState({
    sessionNumber: 1,
    date: "",
    description: "",
  });
  const [bulkSessionForm, setBulkSessionForm] = useState<{
    startDate: string;
    endDate: string;
    weekdays: ActivitySessionWeekday[];
    intervalWeeks: number;
    description: string;
  }>({
    startDate: "",
    endDate: "",
    weekdays: [],
    intervalWeeks: 1,
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
  const [revokeCompletionDialog, setRevokeCompletionDialog] = useState<{
    open: boolean;
    participant: ActivityParticipantResponse | null;
  }>({ open: false, participant: null });
  const [revokingCompletion, setRevokingCompletion] = useState(false);
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
  const [rejectionTarget, setRejectionTarget] =
    useState<ActivityParticipantResponse | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [applicationTarget, setApplicationTarget] =
    useState<ActivityParticipantResponse | null>(null);

  // Session selection states
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    new Set(),
  );
  const [showBulkSessionDeleteDialog, setShowBulkSessionDeleteDialog] =
    useState(false);
  const [bulkSessionDeleting, setBulkSessionDeleting] = useState(false);

  const bulkSessionPreview = useMemo(() => {
    if (
      !bulkSessionForm.startDate ||
      !bulkSessionForm.endDate ||
      bulkSessionForm.weekdays.length === 0
    ) {
      return [];
    }

    const start = parseLocalDate(bulkSessionForm.startDate);
    const end = parseLocalDate(bulkSessionForm.endDate);
    if (start > end) return [];

    const firstWeekStart = new Date(start);
    firstWeekStart.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const existingDates = new Set(sessions.map((session) => session.date));
    const dates: string[] = [];

    for (
      const cursor = new Date(start);
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const cursorWeekStart = new Date(cursor);
      cursorWeekStart.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
      const weekOffset = Math.round(
        (cursorWeekStart.getTime() - firstWeekStart.getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      );
      const dateValue = localDateValue(cursor);
      if (
        weekOffset % bulkSessionForm.intervalWeeks === 0 &&
        bulkSessionForm.weekdays.includes(WEEKDAY_BY_INDEX[cursor.getDay()]) &&
        !existingDates.has(dateValue)
      ) {
        dates.push(dateValue);
      }
    }
    return dates;
  }, [bulkSessionForm, sessions]);

  const sessionTotalPages = Math.max(
    1,
    Math.ceil(sessions.length / SESSIONS_PER_PAGE),
  );
  const paginatedSessions = sessions.slice(
    (sessionPage - 1) * SESSIONS_PER_PAGE,
    sessionPage * SESSIONS_PER_PAGE,
  );
  const completedSessionCount = sessions.filter(
    (session) => session.date <= localDateValue(),
  ).length;
  const upcomingSessionCount = sessions.length - completedSessionCount;

  useEffect(() => {
    setSessionPage((page) => Math.min(page, sessionTotalPages));
  }, [sessionTotalPages]);

  useEffect(() => {
    if (authLoading) return;

    async function fetchData() {
      setLoading(true);
      try {
        const activityData = await getActivityById(activityId);
        const isAssignee = activityData.assignee?.id === userId;
        if (!canAdministerActivity && !isAssignee) {
          toast.error("해당 활동을 관리할 권한이 없습니다.");
          router.replace(`/activities/${activityId}`);
          return;
        }

        const requiresDeposit =
          activityData.activityType.code === "STUDY" ||
          activityData.activityType.code === "SPECIAL_LECTURE";
        const [
          participantsData,
          usersData,
          refundAccountsData,
          materialsData,
          noticesData,
        ] = await Promise.all([
          getActivityParticipantsByActivityId({ activityId }),
          canAdministerActivity ? getAllUsers() : Promise.resolve([]),
          canAdministerActivity && requiresDeposit
            ? getActivityParticipantRefundAccounts(activityId)
            : Promise.resolve([]),
          getLectureMaterialsByActivity(activityId).catch((error) => {
            console.error("Failed to fetch lecture materials:", error);
            return [];
          }),
          getActivityNotices(activityId).catch((error) => {
            console.error("Failed to fetch activity notices:", error);
            return [];
          }),
        ]);
        setActivity(activityData);
        setParticipants(participantsData);
        setFilteredParticipants(participantsData);
        setAllUsers(usersData);
        setRefundAccounts(refundAccountsData);
        setLectureMaterials(materialsData);
        setActivityNotices(noticesData);
      } catch (error: any) {
        console.error("Failed to fetch activity data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activityId, authLoading, canAdministerActivity, router, userId]);

  async function handleAddMember(userId: string) {
    setAddingUserId(userId);
    try {
      const newParticipant = await createActivityParticipant({
        activityId,
        userId,
        status: "APPROVED",
      });
      setParticipants((prev) => [...prev, newParticipant]);
      toast.success("참여자로 추가되었습니다.");
    } catch (error: any) {
      console.error("Failed to add participant:", error);
      toast.error(error.response?.data || "참여자 추가에 실패했습니다.");
    } finally {
      setAddingUserId(null);
    }
  }

  async function refreshScheduleAndAttendance(showLoading = true) {
    if (showLoading) setSessionsLoading(true);
    try {
      const sessionsData = await getActivitySessionsByActivityId(activityId);
      const sortedSessions = [...sessionsData].sort(
        (a, b) => a.sessionNumber - b.sessionNumber,
      );
      setSessions(sortedSessions);
      setSelectedSessionIds((selected) => {
        const validIds = new Set(sortedSessions.map((session) => session.id));
        return new Set([...selected].filter((id) => validIds.has(id)));
      });
      await Promise.all([
        loadAttendanceStats(),
        loadSessionAttendanceStatus(sortedSessions),
      ]);
      return sortedSessions;
    } catch (error: any) {
      console.error("Failed to load sessions:", error);
      toast.error("일정과 출석 현황을 불러오지 못했습니다.");
      return null;
    } finally {
      if (showLoading) setSessionsLoading(false);
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
        const absent = attendances.filter(
          (a) => a.status === "ABSENT" || a.status === "LATE",
        ).length;
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

    if (approvedParticipants.length === 0) {
      setAttendanceStats(new Map());
      return;
    }

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
      refreshScheduleAndAttendance();
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    setActiveTab(value);
    if (value === "schedule" || value === "attendance") {
      void refreshScheduleAndAttendance(false);
    }
  }

  async function refreshMaterials() {
    try {
      setLectureMaterials(await getLectureMaterialsByActivity(activityId));
    } catch (error) {
      console.error("Failed to refresh lecture materials:", error);
    }
  }

  async function refreshNotices() {
    try {
      setActivityNotices(await getActivityNotices(activityId));
    } catch (error) {
      console.error("Failed to refresh activity notices:", error);
    }
  }

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
    if (returnToMyActivities) {
      router.push("/home");
      return;
    }
    router.push(
      canAdministerActivity ? "/manage/activities" : `/activities/${activityId}`,
    );
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
      setSelectedSessionIds((selected) => {
        const next = new Set(selected);
        paginatedSessions.forEach((session) => next.add(session.id));
        return next;
      });
    } else {
      setSelectedSessionIds((selected) => {
        const next = new Set(selected);
        paginatedSessions.forEach((session) => next.delete(session.id));
        return next;
      });
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
  async function handleStatusChange(
    participantId: string,
    newStatus: string,
    reviewMessage?: string,
  ) {
    if (updatingIds.has(participantId)) return false;

    setUpdatingIds((prev) => new Set(prev).add(participantId));

    try {
      const status = newStatus as "APPLIED" | "APPROVED" | "REJECTED";
      await updateActivityParticipantStatus(participantId, {
        activityId,
        status,
        reviewMessage: reviewMessage?.trim() || undefined,
      });

      // Update local state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? {
                ...p,
                status,
                reviewMessage:
                  status === "REJECTED"
                    ? reviewMessage?.trim() || null
                    : null,
              }
            : p,
        ),
      );

      toast.success("상태가 변경되었습니다.");
      return true;
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error(error.response?.data || "상태 변경에 실패했습니다.");
      return false;
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(participantId);
        return next;
      });
    }
  }

  function requestStatusChange(
    participant: ActivityParticipantResponse,
    newStatus: string,
  ) {
    if (
      activity?.activityType.code === "PROJECT" &&
      participant.appliedPosition &&
      newStatus === "REJECTED"
    ) {
      setRejectionTarget(participant);
      setRejectionMessage(participant.reviewMessage || "");
      return;
    }
    void handleStatusChange(participant.id, newStatus);
  }

  async function handleRejectionConfirm() {
    if (!rejectionTarget || !rejectionMessage.trim()) return;
    const updated = await handleStatusChange(
      rejectionTarget.id,
      "REJECTED",
      rejectionMessage,
    );
    if (updated) {
      setRejectionTarget(null);
      setRejectionMessage("");
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
    const results: PromiseSettledResult<R>[] = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        try {
          results[index] = { status: "fulfilled", value: await fn(items[index]) };
        } catch (reason) {
          results[index] = { status: "rejected", reason };
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(limit, items.length) }, () => worker()),
    );
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

  function handleOpenBulkSessionDialog() {
    if (!activity) return;
    const start = parseLocalDate(activity.startDate);
    setBulkSessionForm({
      startDate: activity.startDate,
      endDate: activity.endDate,
      weekdays: [WEEKDAY_BY_INDEX[start.getDay()]],
      intervalWeeks: 1,
      description: "",
    });
    setShowBulkSessionDialog(true);
  }

  function toggleBulkWeekday(weekday: ActivitySessionWeekday) {
    setBulkSessionForm((previous) => ({
      ...previous,
      weekdays: previous.weekdays.includes(weekday)
        ? previous.weekdays.filter((value) => value !== weekday)
        : [...previous.weekdays, weekday],
    }));
  }

  async function handleCreateBulkSessions() {
    if (bulkSessionForm.weekdays.length === 0) {
      toast.error("진행 요일을 하나 이상 선택해주세요.");
      return;
    }
    if (bulkSessionPreview.length === 0) {
      toast.error("새로 생성할 일정이 없습니다.");
      return;
    }

    setBulkSessionCreating(true);
    try {
      const createdSessions = await createActivitySessionsBulk({
        activityId,
        ...bulkSessionForm,
        excludedDates: [],
      });
      const refreshedSessions = await refreshScheduleAndAttendance(false);
      if (refreshedSessions) {
        setSessionPage(
          Math.max(1, Math.ceil(refreshedSessions.length / SESSIONS_PER_PAGE)),
        );
      }
      setShowBulkSessionDialog(false);
      toast.success(`${createdSessions.length}개 일정이 생성되었습니다.`);
    } catch (error: any) {
      console.error("Failed to create recurring sessions:", error);
      toast.error(error.response?.data || "반복 일정 생성에 실패했습니다.");
    } finally {
      setBulkSessionCreating(false);
    }
  }

  async function handleCreateSessionOnly() {
    if (!sessionForm.date) {
      toast.error("날짜를 입력해주세요.");
      return;
    }

    try {
      await createActivitySession({
        activityId,
        sessionNumber: sessionForm.sessionNumber,
        date: sessionForm.date,
        description: sessionForm.description,
      });

      const refreshedSessions = await refreshScheduleAndAttendance(false);
      if (refreshedSessions) {
        setSessionPage(
          Math.max(1, Math.ceil(refreshedSessions.length / SESSIONS_PER_PAGE)),
        );
      }

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
    if (sessionForm.date > localDateValue()) {
      toast.error("미래 일정의 출석은 해당 날짜부터 입력할 수 있습니다.");
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
      await refreshScheduleAndAttendance(false);
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

    setSelectedSessionIds(new Set());
    await refreshScheduleAndAttendance(false);
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
    if (session.date > localDateValue()) {
      toast.info("미래 일정의 출석은 해당 날짜부터 입력할 수 있습니다.");
      return;
    }
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
          } else if (att.status === "ABSENT" || att.status === "LATE") {
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
    if (selectedSession.date > localDateValue()) {
      toast.error("미래 일정의 출석은 해당 날짜부터 입력할 수 있습니다.");
      return;
    }

    const totalAssigned =
      attendanceData.present.size +
      attendanceData.absent.size +
      attendanceData.excused.size;

    const approvedCount = participants.filter(
      (participant) => participant.status === "APPROVED",
    ).length;
    if (totalAssigned !== approvedCount) {
      toast.error("모든 참여자의 출석 상태를 지정해주세요.");
      return;
    }

    try {
      await bulkUpdateAttendances({
        sessionId: selectedSession.id,
        presentParticipantIds: Array.from(attendanceData.present),
        absentParticipantIds: Array.from(attendanceData.absent),
        excusedParticipantIds: Array.from(attendanceData.excused),
      });

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
      await refreshScheduleAndAttendance(false);
    } catch (error: any) {
      console.error("Failed to save attendance:", error);
      toast.error(error.response?.data || "출석 저장에 실패했습니다.");
    }
  }

  function handleSkipAttendanceInput() {
    setShowSessionDialog(false);
    setSessionDialogStep(1);
    void refreshScheduleAndAttendance(false);
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
      await updateActivityParticipantCompleted(
        completionDialog.participant.id,
        true,
      );

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

  async function handleRevokeCompletion() {
    if (!revokeCompletionDialog.participant) return;

    setRevokingCompletion(true);
    try {
      await updateActivityParticipantCompleted(
        revokeCompletionDialog.participant.id,
        false,
      );

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === revokeCompletionDialog.participant!.id
            ? { ...p, completed: false }
            : p,
        ),
      );

      setRevokeCompletionDialog({ open: false, participant: null });
      toast.success("수료가 취소되었습니다.");
    } catch (error: any) {
      console.error("Failed to revoke completion:", error);
      toast.error(error.response?.data || "수료 취소에 실패했습니다.");
    } finally {
      setRevokingCompletion(false);
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
      updateActivityParticipantCompleted(id, true),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;
    const succeededIds = new Set(
      ids.filter((_, index) => results[index]?.status === "fulfilled"),
    );

    setParticipants((prev) =>
      prev.map((p) => (succeededIds.has(p.id) ? { ...p, completed: true } : p)),
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

      const totalSessions = completedSessionCount;
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
          {returnToMyActivities ? "내 활동으로" : "목록으로"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Button
          onClick={handleBackToList}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {returnToMyActivities ? "내 활동으로" : "목록으로"}
        </Button>

        <h1 className="text-xl font-bold tracking-tight">{activity.title}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <ActivityTypeBadge activityType={activity.activityType} />
          <span className="text-sm text-muted-foreground">·</span>
          <ActivityStatusBadge status={activityDisplayStatus(activity)} />
          <span className="text-sm text-muted-foreground">·</span>
          {activity.quarter && (
            <span className="text-xs text-muted-foreground">
              {activity.quarter.name}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" className="px-4 py-2">
            기본 정보
          </TabsTrigger>
          {canReviewApplications && (
            <TabsTrigger value="applications" className="px-4 py-2">
              참여자 현황
            </TabsTrigger>
          )}
          <TabsTrigger value="content" className="px-4 py-2">
            활동 내용
          </TabsTrigger>
          <TabsTrigger value="notices" className="px-4 py-2">
            공지
          </TabsTrigger>
          <TabsTrigger value="schedule" className="px-4 py-2">
            일정·출석 관리
          </TabsTrigger>
          <TabsTrigger value="attendance" className="px-4 py-2">
            출석·수료 현황
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
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {activity.description || "—"}
                    </div>
                  }
                />
                <InfoRow
                  icon={<Tag className="h-4 w-4" />}
                  label="유형"
                  value={activity.activityType.name}
                />
                {activity.activityType.code === "SPECIAL_LECTURE" && (
                  <InfoRow
                    icon={<UserIcon className="h-4 w-4" />}
                    label="강의자 경력"
                    value={
                      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm">
                        {activity.instructorCareer || "—"}
                      </div>
                    }
                  />
                )}
                {operationPlanLabel(activity.activityType.code) && (
                  <InfoRow
                    icon={<FileText className="h-4 w-4" />}
                    label={operationPlanLabel(activity.activityType.code) ?? "계획서"}
                    value={
                      activity.operationPlan &&
                      isOperationPlanUrl(activity.operationPlan) ? (
                        <a
                          href={activity.operationPlan.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-w-0 items-center gap-1.5 text-sm text-[#174b3a] hover:underline"
                        >
                          <span className="truncate">
                            {operationPlanLabel(activity.activityType.code)} 열기
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm">
                          {activity.operationPlan || "—"}
                        </div>
                      )
                    }
                  />
                )}
                {supportsDiscordLink(activity.activityType.code) &&
                    activity.discordUrl && (
                      <InfoRow
                        icon={<MessageCircle className="h-4 w-4" />}
                        label="디스코드"
                        value={
                          <a
                            href={activity.discordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm underline whitespace-nowrap "
                          >
                            디스코드 바로가기 
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        }
                      />
                    )}
                {(activity.activityType.code === "STUDY" ||
                  activity.activityType.code === "SPECIAL_LECTURE") && (
                  <InfoRow
                    icon={<Info className="h-4 w-4" />}
                    label="참여 보증금"
                    value={
                      activity.depositAmount > 0
                        ? `${activity.depositAmount.toLocaleString("ko-KR")}원`
                        : "없음"
                    }
                  />
                )}
                <InfoRow
                  icon={<UserIcon className="h-4 w-4" />}
                  label="참여 정원"
                  value={
                    activity.participantLimit == null
                      ? "제한 없음"
                      : `${
                          participants.filter(
                            (participant) =>
                              (participant.status === "APPLIED" ||
                                participant.status === "APPROVED") &&
                              participant.user.id !== activity.assignee.id,
                          ).length
                        } / ${activity.participantLimit}명`
                  }
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
                  label={
                    activity.activityType.code === "SPECIAL_LECTURE"
                      ? "강의자"
                      : "담당자"
                  }
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
                  {activity.createdBy?.name || "알 수 없음"}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  수정자
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.modifiedBy?.name || "알 수 없음"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {canReviewApplications && (
        <TabsContent value="applications" className="space-y-4">
          {/* 참여자 현황 Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  신청·참여 현황
                  <span className="text-sm font-normal text-muted-foreground">
                    총 {filteredParticipants.length}건
                  </span>
                </CardTitle>
                {canAdministerActivity && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddMemberDialog(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    멤버 추가
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canAdministerActivity && (
                <p className="text-sm text-muted-foreground">
                  개설한 활동의 신청 및 참여 현황을 확인할 수 있습니다.
                </p>
              )}
              {/* Filters / Bulk Toolbar Toggle */}
              {canAdministerActivity && selectedIds.size > 0 ? (
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
                      <SelectItem value="신청 완료">신청 완료</SelectItem>
                      <SelectItem value="참여 확정">참여 확정</SelectItem>
                      <SelectItem value="신청 반려">신청 반려</SelectItem>
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
                  <p className="text-muted-foreground">
                    신청 또는 참여 내역이 없습니다
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canAdministerActivity && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredParticipants.length > 0 &&
                              selectedIds.size === filteredParticipants.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-30">이름</TableHead>
                      <TableHead className="w-30">학번</TableHead>
                      <TableHead className="w-60">이메일</TableHead>
                      {activity.activityType.code === "PROJECT" && (
                        <>
                          <TableHead className="w-36">지원 포지션</TableHead>
                          <TableHead className="w-28 text-center">지원 내용</TableHead>
                        </>
                      )}
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
                          onClick={
                            canAdministerActivity
                              ? (e) => handleMemberClick(participant.user!.id, e)
                              : undefined
                          }
                          className={canAdministerActivity ? "cursor-pointer" : undefined}
                        >
                          {canAdministerActivity && (
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
                          )}
                          <TableCell className="font-medium">
                            {participant.user?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {participant.user?.studentId || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {participant.user?.email || "-"}
                          </TableCell>
                          {activity.activityType.code === "PROJECT" && (
                            <>
                              <TableCell className="text-sm">
                                {participant.appliedPosition || "초기 참여자"}
                              </TableCell>
                              <TableCell
                                className="text-center"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {participant.appliedPosition ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setApplicationTarget(participant)}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    내용 보기
                                  </Button>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-center">
                            {activity.activityType.code === "PROJECT" &&
                            (canAdministerActivity || participant.appliedPosition) ? (
                              <ParticipantStatusSelector
                                value={participant.status}
                                onChange={(status) =>
                                  requestStatusChange(participant, status)
                                }
                                disabled={isUpdating}
                                appliedLabel="검토 대기"
                              />
                            ) : (
                              <ParticipantStatusBadge
                                status={participant.status}
                              />
                            )}
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

          {canAdministerActivity &&
            (activity.activityType.code === "STUDY" ||
              activity.activityType.code === "SPECIAL_LECTURE") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    보증금 환급 정보
                    <span className="text-sm font-normal text-muted-foreground">
                      총 {refundAccounts.length}건
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {refundAccounts.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      등록된 환급 계좌가 없습니다.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>이름</TableHead>
                            <TableHead>학번</TableHead>
                            <TableHead>은행</TableHead>
                            <TableHead>계좌번호</TableHead>
                            <TableHead>예금주</TableHead>
                            <TableHead>입금 확인 시각</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {refundAccounts.map((account) => (
                            <TableRow key={account.participantId}>
                              <TableCell className="font-medium">
                                {account.userName}
                              </TableCell>
                              <TableCell>{account.studentId}</TableCell>
                              <TableCell>{account.bankName}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {account.accountNumber}
                              </TableCell>
                              <TableCell>{account.accountHolder}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDateTime(account.paymentConfirmedAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    환급 계좌 정보는 보증금 반환 업무에만 사용해주세요.
                  </p>
                </CardContent>
              </Card>
            )}

          {/* 멤버 직접 추가 Dialog */}
          {canAdministerActivity && <Dialog
            open={showAddMemberDialog}
            onOpenChange={(open) => {
              setShowAddMemberDialog(open);
              if (!open) setAddMemberSearch("");
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>멤버 직접 추가</DialogTitle>
                <DialogDescription>
                  선택하면 신청 절차 없이 바로 참여 확정 상태로 추가됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  placeholder="이름 또는 학번으로 검색"
                  value={addMemberSearch}
                  onChange={(e) => setAddMemberSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="h-72 overflow-y-auto rounded-md border divide-y">
                {(() => {
                  const existingUserIds = new Set(
                    participants.map((p) => p.user?.id),
                  );
                  const q = addMemberSearch.trim().toLowerCase();
                  const addableUsers = allUsers
                    .filter((u) => !existingUserIds.has(u.id))
                    .filter(
                      (u) =>
                        !q ||
                        u.name?.toLowerCase().includes(q) ||
                        u.username?.toLowerCase().includes(q) ||
                        u.studentId?.toLowerCase().includes(q),
                    );

                  if (addableUsers.length === 0) {
                    return (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        {allUsers.length === 0
                          ? "불러오는 중..."
                          : "추가할 수 있는 학회원이 없습니다"}
                      </div>
                    );
                  }

                  return addableUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleAddMember(user.id)}
                      disabled={addingUserId === user.id}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/40 disabled:opacity-50"
                    >
                      <span className="flex-1 font-medium">
                        {user.name || user.username}
                      </span>
                      {user.studentId && (
                        <span className="text-xs text-muted-foreground">
                          {user.studentId}
                        </span>
                      )}
                      <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ));
                })()}
              </div>
            </DialogContent>
          </Dialog>}
        </TabsContent>
        )}
        {/* Tab: 활동 내용 */}
        <TabsContent value="content" className="space-y-4">
          <WeeklyMaterials
            activityId={activityId}
            materials={lectureMaterials}
            discordUrl={activity?.discordUrl}
            canManage
            canModify
            onChanged={refreshMaterials}
          />
        </TabsContent>

        {/* Tab: 공지 */}
        <TabsContent value="notices" className="space-y-4">
          <ActivityNotices
            activityId={activityId}
            notices={activityNotices}
            canManage
            canModify
            onChanged={refreshNotices}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          {/* 진행 일정 Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>진행 일정</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenBulkSessionDialog}
                  >
                    <CalendarRange className="h-3.5 w-3.5" />
                    <span className="text-xs">반복 일정</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenSessionDialog}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="text-xs">한 회차</span>
                  </Button>
                </div>
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
                <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            paginatedSessions.length > 0 &&
                            paginatedSessions.every((session) =>
                              selectedSessionIds.has(session.id),
                            )
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
                    {paginatedSessions.map((session) => {
                      const status = sessionAttendanceStatus.get(session.id);
                      const hasAttendance = status && status.total > 0;
                      const isFutureSession = session.date > localDateValue();

                      return (
                        <TableRow
                          key={session.id}
                          className={
                            isFutureSession
                              ? "bg-muted/20"
                              : "cursor-pointer"
                          }
                          onClick={
                            isFutureSession
                              ? undefined
                              : () => handleOpenAttendanceDialog(session)
                          }
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
                            {isFutureSession ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  예정
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  당일부터 입력 가능
                                </span>
                              </div>
                            ) : hasAttendance ? (
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
                {sessionTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 border-t pt-5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="이전 페이지"
                      onClick={() =>
                        setSessionPage((page) => Math.max(1, page - 1))
                      }
                      disabled={sessionPage === 1}
                    >
                      <ChevronLeft />
                    </Button>
                    <span className="min-w-16 text-center text-sm font-medium text-muted-foreground">
                      {sessionPage} / {sessionTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="다음 페이지"
                      onClick={() =>
                        setSessionPage((page) =>
                          Math.min(sessionTotalPages, page + 1),
                        )
                      }
                      disabled={sessionPage === sessionTotalPages}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                )}
                </>
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
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-4 text-sm">
                <span className="text-muted-foreground">
                  전체 일정{" "}
                  <strong className="font-semibold text-foreground">
                    {sessions.length}회
                  </strong>
                </span>
                <span className="text-muted-foreground">
                  진행 회차{" "}
                  <strong className="font-semibold text-foreground">
                    {completedSessionCount}회
                  </strong>
                </span>
                <span className="text-muted-foreground">
                  예정 회차{" "}
                  <strong className="font-semibold text-foreground">
                    {upcomingSessionCount}회
                  </strong>
                </span>
              </div>
              {canAdministerActivity && selectedCompletionIds.size > 0 ? (
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
                        {canAdministerActivity && <TableHead className="w-12">
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
                        </TableHead>}
                        <TableHead className="w-32">이름</TableHead>
                        <TableHead className="w-32">학번</TableHead>
                        <TableHead className="text-center w-24">
                          출석률
                        </TableHead>
                        <TableHead className="text-center w-32">
                          출석/진행 회차
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
                              {canAdministerActivity && <TableCell>
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
                              </TableCell>}
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
                                  ? `${stats.presentCount + stats.excusedCount}/${stats.totalSessions}`
                                  : `0/${completedSessionCount}`}
                              </TableCell>
                              <TableCell className="text-center">
                                {participant.completed ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="border-green-200 bg-green-50 text-green-700"
                                    >
                                      수료
                                    </Badge>
                                    {canAdministerActivity && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-destructive hover:text-destructive"
                                        onClick={() =>
                                          setRevokeCompletionDialog({
                                            open: true,
                                            participant,
                                          })
                                        }
                                      >
                                        취소
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    미수료
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>

                  <p className="text-xs text-muted-foreground mt-2">
                    출석률은 오늘까지 진행된 회차 중 출석과 공결을 기준으로 계산합니다.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {canReviewApplications && <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleEdit}>
          <Pencil className="h-3 w-3" />
          <span className="text-xs">수정</span>
        </Button>
        {canAdministerActivity && (
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-3 w-3" />
            <span className="text-xs">삭제</span>
          </Button>
        )}
      </div>}

      <Dialog open={showBulkSessionDialog} onOpenChange={setShowBulkSessionDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>반복 일정 생성</DialogTitle>
            <DialogDescription>
              활동 기간과 요일을 기준으로 여러 회차를 한 번에 만듭니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="bulk-session-start">
                  시작일
                </label>
                <Input
                  id="bulk-session-start"
                  type="date"
                  min={activity.startDate}
                  max={activity.endDate}
                  value={bulkSessionForm.startDate}
                  onChange={(event) =>
                    setBulkSessionForm((previous) => ({
                      ...previous,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="bulk-session-end">
                  종료일
                </label>
                <Input
                  id="bulk-session-end"
                  type="date"
                  min={activity.startDate}
                  max={activity.endDate}
                  value={bulkSessionForm.endDate}
                  onChange={(event) =>
                    setBulkSessionForm((previous) => ({
                      ...previous,
                      endDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">진행 요일</span>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_OPTIONS.map((weekday) => {
                  const selected = bulkSessionForm.weekdays.includes(weekday.value);
                  return (
                    <Button
                      key={weekday.value}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      aria-pressed={selected}
                      className="px-0"
                      onClick={() => toggleBulkWeekday(weekday.value)}
                    >
                      {weekday.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="text-sm font-medium">반복 주기</span>
                <Select
                  value={String(bulkSessionForm.intervalWeeks)}
                  onValueChange={(value) =>
                    setBulkSessionForm((previous) => ({
                      ...previous,
                      intervalWeeks: Number(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">매주</SelectItem>
                    <SelectItem value="2">2주마다</SelectItem>
                    <SelectItem value="3">3주마다</SelectItem>
                    <SelectItem value="4">4주마다</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="bulk-session-description">
                  공통 설명
                </label>
                <Input
                  id="bulk-session-description"
                  value={bulkSessionForm.description}
                  placeholder="선택 사항"
                  onChange={(event) =>
                    setBulkSessionForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium">{bulkSessionPreview.length}개 일정 생성 예정</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {bulkSessionPreview.length > 0
                  ? `${bulkSessionPreview.slice(0, 3).map(formatDate).join(", ")}${bulkSessionPreview.length > 3 ? ` 외 ${bulkSessionPreview.length - 3}개` : ""}`
                  : "기간과 요일을 확인해주세요."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkSessionDialog(false)}
              disabled={bulkSessionCreating}
            >
              취소
            </Button>
            <Button onClick={handleCreateBulkSessions} disabled={bulkSessionCreating}>
              {bulkSessionCreating ? "생성 중..." : "일정 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    {sessionForm.date > localDateValue() && (
                      <p className="text-xs text-muted-foreground">
                        미래 일정은 생성할 수 있으며, 출석은 일정 당일부터 입력할
                        수 있습니다.
                      </p>
                    )}
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
                <Button
                  variant={
                    sessionForm.date > localDateValue() ? "default" : "outline"
                  }
                  onClick={handleCreateSessionOnly}
                >
                  일정만 생성
                </Button>
                <Button
                  onClick={handleCreateSessionAndAttendance}
                  disabled={sessionForm.date > localDateValue()}
                >
                  {sessionForm.date > localDateValue()
                    ? "출석은 당일부터"
                    : "다음: 출석 입력"}
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

      <AlertDialog
        open={revokeCompletionDialog.open}
        onOpenChange={(open) =>
          !revokingCompletion &&
          setRevokeCompletionDialog({
            open,
            participant: revokeCompletionDialog.participant,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수료를 취소할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeCompletionDialog.participant?.user?.name} 학회원의 수료가
              취소되고 미수료 상태로 돌아갑니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokingCompletion}>
              돌아가기
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={revokingCompletion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleRevokeCompletion();
              }}
            >
              {revokingCompletion ? "취소 중..." : "수료 취소"}
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

      <Dialog
        open={applicationTarget !== null}
        onOpenChange={(open) => {
          if (!open) setApplicationTarget(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>프로젝트 지원 내용</DialogTitle>
            <DialogDescription>
              신청자가 작성한 지원 정보를 확인하세요.
            </DialogDescription>
          </DialogHeader>
          {applicationTarget && (
            <div className="space-y-5 py-1">
              <div className="grid grid-cols-2 gap-4 rounded-md border bg-muted/20 p-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">지원자</p>
                  <p className="font-medium">
                    {applicationTarget.user?.name || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">학번</p>
                  <p className="font-medium">
                    {applicationTarget.user?.studentId || "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">지원 포지션</p>
                <p className="rounded-md border px-3 py-2.5 text-sm">
                  {applicationTarget.appliedPosition || "—"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">관련 경험 및 지원 내용</p>
                <div className="max-h-72 overflow-y-auto rounded-md border px-4 py-3">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                    {applicationTarget.applicationMessage ||
                      "작성된 지원 내용이 없습니다."}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApplicationTarget(null)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectionTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectionTarget(null);
            setRejectionMessage("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>프로젝트 신청 반려 안내</DialogTitle>
            <DialogDescription>
              {rejectionTarget?.user?.name || "신청자"}님에게 전달할 안내를
              작성해주세요. 신청 결과와 함께 표시됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="rejection-message" className="mb-3 block text-sm font-medium">
              반려 안내 <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="rejection-message"
              value={rejectionMessage}
              onChange={(event) => setRejectionMessage(event.target.value)}
              placeholder="예: 이번에는 프론트엔드 모집 인원이 모두 확정되어 함께하지 못하게 되었습니다. 죄송합니다."
              rows={5}
              maxLength={500}
              disabled={
                rejectionTarget
                  ? updatingIds.has(rejectionTarget.id)
                  : false
              }
            />
            <p className="text-right text-xs text-muted-foreground">
              {rejectionMessage.length}/500
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectionTarget(null);
                setRejectionMessage("");
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRejectionConfirm()}
              disabled={
                !rejectionMessage.trim() ||
                (rejectionTarget
                  ? updatingIds.has(rejectionTarget.id)
                  : false)
              }
            >
              신청 반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              선택한 {selectedCompletionIds.size}명을 수료 처리합니다.
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
