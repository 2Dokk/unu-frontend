"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getActivityById,
  deleteActivity,
  updateActivityStatus,
} from "@/lib/api/activity";
import {
  getMyParticipantByActivityId,
  createMyParticipantByActivityId,
  deleteActivityParticipant,
} from "@/lib/api/activity-participant";
import { ActivityResponse } from "@/lib/interfaces/activity";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import {
  Calendar,
  User,
  ClipboardList,
  BadgeCheck,
  BadgeX,
  Clock,
  Settings,
  Pencil,
  Trash2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { CourseTimeReservationCard } from "@/components/custom/activity/course-time-reservation";
import { CourseSessionReportCard } from "@/components/custom/activity/course-session-report";
import { formatDate } from "@/lib/utils/date-utils";
import { ActivityTypeBadge } from "@/components/custom/activity/activity-type-badge";
import { ActivityStatusBadge } from "@/components/custom/activity/activity-status-badge";
import { toast } from "sonner";

// ========================
// TYPES & HELPERS
// ========================

interface ActivityStatusMeta {
  label: string;
}

function getActivityStatusMeta(status: string): ActivityStatusMeta {
  const statusMap: Record<string, ActivityStatusMeta> = {
    CREATED: {
      label: "준비 중",
    },
    OPEN: {
      label: "모집 중",
    },
    ONGOING: {
      label: "진행 중",
    },
    COMPLETED: {
      label: "종료",
    },
  };

  return (
    statusMap[status] || {
      label: `상태: ${status}`,
      variant: "outline",
      className: "bg-gray-50 text-gray-600 border-gray-200",
    }
  );
}

interface ParticipantStatusMeta {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  icon: React.ComponentType<{ className?: string }>;
}

function getMyParticipantMeta(
  participant: ActivityParticipantResponse | null,
): ParticipantStatusMeta {
  if (!participant) {
    return {
      label: "미신청",
      variant: "outline",
      icon: ClipboardList,
    };
  }

  const statusMap: Record<string, ParticipantStatusMeta> = {
    APPLIED: {
      label: "신청 완료",
      variant: "secondary",
      icon: ClipboardList,
    },
    APPROVED: {
      label: "참여 확정",
      variant: "default",
      icon: BadgeCheck,
    },
    REJECTED: {
      label: "반려됨",
      variant: "destructive",
      icon: BadgeX,
    },
  };

  return (
    statusMap[participant.status] || {
      label: participant.status,
      variant: "outline",
      icon: ClipboardList,
    }
  );
}

interface CtaConfig {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  disabled: boolean;
  disabledReason?: string;
  onClick: () => void;
  secondaryActions?: Array<{
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    onClick: () => void;
  }>;
}

function deriveCtaConfig(
  activity: ActivityResponse,
  participant: ActivityParticipantResponse | null,
  handlers: {
    onApply: () => void;
    onCancel: () => void;
    onComplete: () => void;
    onLeave: () => void;
    onReapply: () => void;
  },
): CtaConfig {
  const isRecruiting =
    activity.status === "RECRUITING" || activity.status === "OPEN";

  if (!participant) {
    return {
      label: "참여 신청",
      variant: "default",
      disabled: !isRecruiting,
      disabledReason: isRecruiting ? undefined : "모집 중이 아닙니다",
      onClick: handlers.onApply,
    };
  }

  if (participant.status === "APPLIED") {
    return {
      label: "신청 취소",
      variant: "outline",
      disabled: false,
      onClick: handlers.onCancel,
    };
  }

  if (participant.status === "APPROVED") {
    return {
      label: "활동 나가기",
      variant: "outline",
      onClick: handlers.onLeave,
      disabled: activity.status === "COMPLETED",
    };
  }

  if (participant.status === "REJECTED") {
    return {
      label: "재신청",
      variant: "outline",
      disabled: !isRecruiting,
      disabledReason: isRecruiting ? undefined : "모집 중이 아닙니다",
      onClick: handlers.onReapply,
    };
  }

  return {
    label: "참여 신청",
    variant: "default",
    disabled: true,
    onClick: handlers.onApply,
  };
}

const STATUS_OPTIONS = [
  { value: "CREATED", label: "생성됨" },
  { value: "OPEN", label: "모집중" },
  { value: "ONGOING", label: "진행중" },
  { value: "COMPLETED", label: "완료됨" },
];

// ========================
// INFO ROW COMPONENT
// ========================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

// ========================
// MAIN COMPONENT
// ========================

export default function ActivityDetails() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [myParticipant, setMyParticipant] =
    useState<ActivityParticipantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const { userRole, hasRole, userId } = useAuth();

  useEffect(() => {
    const fetchActivityDetails = async () => {
      setLoading(true);
      try {
        const [activityData, participantData] = await Promise.all([
          getActivityById(activityId),
          getMyParticipantByActivityId(activityId),
        ]);
        setActivity(activityData);
        setMyParticipant(participantData);
      } catch (error: any) {
        console.error("Failed to fetch activity details:", error);
        toast.error(
          "활동 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivityDetails();
  }, [activityId]);

  const handleApply = async () => {
    if (!activity) return;
    setActionLoading(true);
    try {
      const newParticipant = await createMyParticipantByActivityId({
        activityId: activity.id,
      });
      setMyParticipant(newParticipant);
    } catch (error: any) {
      console.error("Failed to apply for activity:", error);
      toast.error("참여 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!myParticipant) return;
    setActionLoading(true);
    try {
      await deleteActivityParticipant(myParticipant.id);
      setMyParticipant(null);
    } catch (error: any) {
      console.error("Failed to cancel activity:", error);
      toast.error(
        "참여를 취소하는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    // TODO: Implement complete toggle logic
    console.log("Toggle complete status");
  };

  const handleLeave = async () => {
    if (!myParticipant) return;
    setActionLoading(true);
    try {
      await deleteActivityParticipant(myParticipant.id);
      setMyParticipant(null);
      setLeaveDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to leave activity:", error);
      toast.error(
        "참여를 취소하는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReapply = async () => {
    await handleApply();
  };

  const handleEdit = () => {
    router.push(`/manage/activities/${activityId}/edit`);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activity) return;
    try {
      const updated = await updateActivityStatus(activity.id, newStatus);
      setActivity(updated);
    } catch (error: any) {
      console.error("Failed to update activity status:", error);
      toast.error(
        error.response?.data?.message ||
          "활동 상태를 변경하는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  };

  const handleDelete = async () => {
    if (!activity) return;
    try {
      await deleteActivity(activity.id);
      router.push("/activities");
    } catch (error: any) {
      console.error("Failed to delete activity:", error);
      toast.error(
        error.response?.data?.message ||
          "활동을 삭제하는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-3 border-b pb-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-7 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        {/* Description card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-16" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        {/* Info card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-full mt-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-12">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-lg">
              활동을 찾을 수 없습니다
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/activities")}
            >
              활동 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activityStatusMeta = getActivityStatusMeta(activity.status);
  const participantMeta = getMyParticipantMeta(myParticipant);
  const canManage =
    hasRole("MANAGER") || hasRole("ADMIN") || activity.assignee.id === userId;
  const ctaConfig = deriveCtaConfig(activity, myParticipant, {
    onApply: handleApply,
    onCancel: handleCancel,
    onComplete: handleComplete,
    onLeave: () => setLeaveDialogOpen(true),
    onReapply: handleReapply,
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      <div className="space-y-2 border-b pb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/activities")}
          className="mb-2"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>

        <div className="space-y-3">
          <h1 className="text-xl font-bold tracking-tight">{activity.title}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <ActivityTypeBadge activityType={activity.activityType} />
            <ActivityStatusBadge status={activity.status} />
          </div>
        </div>
      </div>

      {activity.description && (
        <Card>
          <CardHeader>
            <CardTitle>설명</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mt-3 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold mt-2 mb-1">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-muted-foreground mb-2 last:mb-0 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 mb-2 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-muted-foreground">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-muted text-foreground rounded px-1 py-0.5 text-xs font-mono">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-muted pl-3 italic text-muted-foreground my-2">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-3 border-border" />,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-primary underline underline-offset-2 hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {activity.description}
            </ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {/* My Participant Status Card (Mobile) */}
      <Card className="lg:hidden border-l-4 border-l-primary">
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <participantMeta.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">내 참여 상태</p>
                <p className="font-semibold">{participantMeta.label}</p>
                {myParticipant && (
                  <Badge
                    variant={myParticipant.completed ? "default" : "outline"}
                    className="mt-1"
                  >
                    {myParticipant.completed ? "수료" : "미수료"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          {activity.activityType.code === "ONLINE_COURSE" && (
            <CourseTimeReservationCard activityId={activityId} />
          )}
          {activity.activityType.code === "ONLINE_COURSE" && (
            <CourseSessionReportCard
              activityId={activityId}
              myParticipant={myParticipant}
            />
          )}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <CardTitle className="text-md font-semibold">활동 정보</CardTitle>
              {userRole === "MANAGER" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="관리 메뉴"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        상태 변경
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {STATUS_OPTIONS.map(({ value, label }) => (
                          <DropdownMenuItem
                            key={value}
                            disabled={activity.status === value}
                            onClick={() => handleStatusChange(value)}
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent className="divide-y divide-border px-6 pb-4 pt-0">
              {activity.quarter && (
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="분기"
                  value={`${activity.quarter.year} ${activity.quarter.season}`}
                />
              )}

              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="기간"
                value={`${formatDate(activity.startDate)} ~ ${formatDate(activity.endDate)}`}
              />

              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="담당자"
                value={
                  activity.assignee.name ||
                  activity.assignee.username ||
                  activity.assignee.email
                }
              />

              {/* My Participant Status (Desktop) */}
              <div className="hidden lg:flex items-start gap-3 py-3">
                <div className="mt-0.5 text-muted-foreground">
                  <participantMeta.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    내 참여 상태
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={participantMeta.variant}>
                      {participantMeta.label}
                    </Badge>
                    {myParticipant && (
                      <Badge
                        variant={
                          myParticipant.completed ? "default" : "outline"
                        }
                        className="text-xs"
                      >
                        {myParticipant.completed ? "수료" : "미수료"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  variant={ctaConfig.variant}
                  disabled={ctaConfig.disabled || actionLoading}
                  onClick={ctaConfig.onClick}
                  aria-label={ctaConfig.label}
                >
                  {actionLoading ? "처리 중..." : ctaConfig.label}
                </Button>
                {ctaConfig.disabledReason && ctaConfig.disabled && (
                  <p className="text-xs text-muted-foreground text-center">
                    {ctaConfig.disabledReason}
                  </p>
                )}
                {ctaConfig.secondaryActions &&
                  ctaConfig.secondaryActions.map((action, index) => (
                    <Button
                      key={index}
                      className="w-full"
                      variant={action.variant}
                      onClick={action.onClick}
                      disabled={actionLoading}
                    >
                      {action.label}
                    </Button>
                  ))}
                {canManage && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      router.push(`/manage/activities/${activityId}`)
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    활동 관리하러 가기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemValue={activity.title}
        onConfirm={handleDelete}
      />

      {/* Leave Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>활동에서 나가시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              활동에서 나가면 참여 기록이 삭제됩니다. 다시 참가하려면 재신청이
              필요합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
