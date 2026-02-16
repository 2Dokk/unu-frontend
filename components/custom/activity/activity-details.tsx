"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { getActivityById } from "@/lib/api/activity";
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
  Users,
  ClipboardList,
  BadgeCheck,
  BadgeX,
  Clock,
  Settings,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

interface ActivityDetailsProps {
  activityId: number;
}

// ========================
// HELPER FUNCTIONS
// ========================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

interface ActivityStatusMeta {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}

function getActivityStatusMeta(status: string): ActivityStatusMeta {
  const statusMap: Record<string, ActivityStatusMeta> = {
    CREATED: {
      label: "준비 중",
      variant: "outline",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
    RECRUITING: {
      label: "모집 중",
      variant: "default",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    OPEN: {
      label: "모집 중",
      variant: "default",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    IN_PROGRESS: {
      label: "진행 중",
      variant: "secondary",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    ONGOING: {
      label: "진행 중",
      variant: "secondary",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    COMPLETED: {
      label: "종료",
      variant: "secondary",
      className: "bg-gray-100 text-gray-600 border-gray-200",
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
      label: participant.completed ? "완료 처리됨" : "활동 완료 처리",
      variant: participant.completed ? "secondary" : "default",
      disabled: participant.completed,
      onClick: handlers.onComplete,
      secondaryActions: [
        {
          label: "활동 나가기",
          variant: "destructive",
          onClick: handlers.onLeave,
        },
      ],
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

// ========================
// MAIN COMPONENT
// ========================

export function ActivityDetails({ activityId }: ActivityDetailsProps) {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [myParticipant, setMyParticipant] =
    useState<ActivityParticipantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  // TODO: Replace with actual viewer logic (e.g., from context or session)
  const viewer = { userId: 1, isAdmin: false };

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
      } catch (error) {
        console.error("Failed to fetch activity details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityDetails();
  }, [activityId]);

  // ========================
  // HANDLERS
  // ========================

  const handleApply = async () => {
    if (!activity) return;
    setActionLoading(true);
    try {
      const newParticipant = await createMyParticipantByActivityId({
        activityId: activity.id,
      });
      setMyParticipant(newParticipant);
    } catch (error) {
      console.error("Failed to apply for activity:", error);
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
    } catch (error) {
      console.error("Failed to cancel activity:", error);
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
    } catch (error) {
      console.error("Failed to leave activity:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReapply = async () => {
    await handleApply();
  };

  const handleEdit = () => {
    // TODO: Navigate to edit page
    router.push(`/activities/${activityId}/edit`);
  };

  const handleStatusChange = () => {
    // TODO: Open status change dialog
    console.log("Open status change dialog");
  };

  const handleDelete = async () => {
    // TODO: Implement delete logic
    console.log("Delete activity");
    setDeleteDialogOpen(false);
  };

  // ========================
  // LOADING STATE
  // ========================

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-150 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-12">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-lg">
              활동을 찾을 수 없습니다.
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
  const ctaConfig = deriveCtaConfig(activity, myParticipant, {
    onApply: handleApply,
    onCancel: handleCancel,
    onComplete: handleComplete,
    onLeave: () => setLeaveDialogOpen(true),
    onReapply: handleReapply,
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Mobile/Desktop Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Main Content (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Breadcrumbs */}
          <Button
            variant="ghost"
            onClick={() => router.push("/activities")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>

          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">
                {activity.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={activityStatusMeta.variant}
                className={activityStatusMeta.className}
              >
                {activityStatusMeta.label}
              </Badge>
              <Badge variant="outline" className="bg-slate-50">
                {activity.activityType.name}
              </Badge>
            </div>
          </div>

          {/* My Participant Status Card (Mobile Priority) */}
          <Card className="lg:hidden border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <participantMeta.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      내 참여 상태
                    </p>
                    <p className="font-semibold">{participantMeta.label}</p>
                    {myParticipant && (
                      <Badge
                        variant={
                          myParticipant.completed ? "default" : "outline"
                        }
                        className="mt-1"
                      >
                        {myParticipant.completed ? "완료" : "미완료"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="participants">참여 상태</TabsTrigger>
              <TabsTrigger value="records">기록</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>활동 설명</CardTitle>
                </CardHeader>
                <CardContent>
                  {activity.description ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                      {activity.description}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      설명이 아직 없어요.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participants" className="space-y-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    참여자 목록 기능은 준비 중입니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records" className="space-y-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    활동 기록 기능은 준비 중입니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Summary Card */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold">
                  활동 정보
                </CardTitle>
                {viewer.isAdmin && (
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
                      <DropdownMenuItem onClick={handleStatusChange}>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        상태 변경
                      </DropdownMenuItem>
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
              <CardContent className="space-y-4">
                {/* Quarter */}
                {activity.quarter && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">분기</p>
                      <p className="font-medium">
                        {activity.quarter.year} {activity.quarter.season}
                      </p>
                    </div>
                  </div>
                )}

                {/* Period */}
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">기간</p>
                    <p className="font-medium">
                      {formatDate(activity.startDate)} ~{" "}
                      {formatDate(activity.endDate)}
                    </p>
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">담당자</p>
                    <p className="font-medium">
                      {activity.assignee.name ||
                        activity.assignee.username ||
                        activity.assignee.email}
                    </p>
                    {activity.assignee.name && (
                      <p className="text-xs text-muted-foreground">
                        {activity.assignee.email}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* My Participant Status (Desktop Only) */}
                <div className="hidden lg:block">
                  <div className="flex items-start gap-3">
                    <participantMeta.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        내 참여 상태
                      </p>
                      <div className="flex items-center gap-2 mt-1">
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
                            {myParticipant.completed ? "완료" : "미완료"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Primary CTA */}
                <div className="space-y-2">
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
                </div>

                <Separator />

                {/* Meta Info (Collapsed) */}
                <details className="text-xs text-muted-foreground space-y-1">
                  <summary className="cursor-pointer hover:text-foreground">
                    메타 정보
                  </summary>
                  <div className="mt-2 space-y-1 pl-2">
                    <p>생성: {formatDateTime(activity.createdAt)}</p>
                    <p>수정: {formatDateTime(activity.modifiedAt)}</p>
                    <p>생성자: {activity.createdBy}</p>
                    <p>수정자: {activity.modifiedBy}</p>
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>활동을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 활동과 관련된 모든 데이터가
              영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation Dialog */}
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
