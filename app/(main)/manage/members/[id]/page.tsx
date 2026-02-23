"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getUserById,
  changeUserRole,
  updateUserActiveStatus,
} from "@/lib/api/user";
import { getActivityParticipantsByUserId } from "@/lib/api/activity-participant";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import { getRoleBadgeVariant, getRoleLabel } from "@/lib/utils/role-utils";
import { useAuth } from "@/lib/contexts/AuthContext";

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

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    APPLIED: "신청됨",
    APPROVED: "승인됨",
    REJECTED: "거절됨",
  };
  return statusMap[status] || status;
}

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "APPROVED":
      return "default";
    case "APPLIED":
      return "secondary";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
}

// ========================
// MAIN COMPONENT
// ========================

const ASSIGNABLE_ROLES = ["MEMBER", "MANAGER", "ADMIN"] as const;

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");

  const [member, setMember] = useState<UserResponseDto | null>(null);
  const [participants, setParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "completed">("all");

  // Active status state
  const [activeLoading, setActiveLoading] = useState(false);

  // Role management state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [memberData, participantsData] = await Promise.all([
          getUserById(memberId),
          getActivityParticipantsByUserId({ userId: memberId }),
        ]);

        setMember(memberData);
        setSelectedRoles(memberData.userRoles?.map((r) => r.role.name) ?? []);
        setParticipants(participantsData);
      } catch (err) {
        console.error("Failed to load member data:", err);
        setError("회원 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [memberId]);

  const handleActiveToggle = async (value: boolean) => {
    if (!member) return;
    setActiveLoading(true);
    try {
      const updated = await updateUserActiveStatus(memberId, value);
      setMember(updated);
      toast.success("활동 여부가 변경되었습니다.");
    } catch {
      toast.error("활성 상태 변경에 실패했습니다.");
    } finally {
      setActiveLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleRoleSave = async () => {
    setRoleLoading(true);
    try {
      const updated = await changeUserRole({
        userId: memberId,
        roles: selectedRoles,
      });
      setMember(updated);
      toast.success("권한이 변경되었습니다.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "권한 변경에 실패했습니다.");
    } finally {
      setRoleLoading(false);
    }
  };

  const handleActivityClick = (activityId?: string) => {
    if (activityId) {
      router.push(`/activities/${activityId}`);
    }
  };

  // Filter participants based on active tab
  const filteredParticipants =
    activeTab === "completed"
      ? participants.filter((p) => p.completed === true)
      : participants;

  const completedCount = participants.filter(
    (p) => p.completed === true,
  ).length;

  // Group participants by quarter
  const participantsByQuarter = filteredParticipants.reduce(
    (acc, participant) => {
      const quarter = participant.activity?.quarter?.name || "기타";
      if (!acc[quarter]) {
        acc[quarter] = [];
      }
      acc[quarter].push(participant);
      return acc;
    },
    {} as Record<string, ActivityParticipantResponse[]>,
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b pb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/manage/members")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {member?.name || "학회원 상세"}
        </h1>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-5">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Member Content */}
      {!loading && member && (
        <div className="space-y-5">
          {/* Member Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Primary Identity */}
                <div className="shrink-0 md:w-64">
                  <h2 className="text-2xl font-semibold mb-2">
                    {member.name || member.username}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {member.userRoles?.length ? (
                      member.userRoles.map((role) => (
                        <Badge
                          key={role.id}
                          variant={getRoleBadgeVariant(role.role.name)}
                        >
                          {getRoleLabel(role.role.name)}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">없음</Badge>
                    )}
                    {member.isActive !== undefined && (
                      <Badge
                        variant={member.isActive ? "default" : "secondary"}
                      >
                        {member.isActive ? "활성" : "비활성"}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <Separator
                  orientation="vertical"
                  className="hidden md:block h-auto"
                />

                {/* Right: Attributes */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Student ID */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">학번</p>
                      <p className="font-medium">{member.studentId || "—"}</p>
                    </div>

                    {/* Username */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        아이디
                      </p>
                      <p className="font-medium">{member.username}</p>
                    </div>

                    {/* Email */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        이메일
                      </p>
                      <p className="font-medium">{member.email}</p>
                    </div>

                    {/* Joined Quarter */}
                    {member.joinedQuarter && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          가입 분기
                        </p>
                        <p className="font-medium">
                          {member.joinedQuarter?.name}
                        </p>
                      </div>
                    )}

                    {/* Phone Number */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        전화번호
                      </p>
                      <p className="font-medium">
                        {(member as any).phoneNumber || "—"}
                      </p>
                    </div>

                    {/* GitHub ID */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        GitHub ID
                      </p>
                      <p className="font-medium">
                        {(member as any).githubId || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Status Card — MANAGER only */}
          {isManager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  분기 활동 여부
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>이번 분기 활성 학회원</Label>
                    <p className="text-sm text-muted-foreground">
                      이번 분기에 활동 중인 학회원으로 표시합니다.
                    </p>
                  </div>
                  <Switch
                    checked={member.isActive ?? false}
                    onCheckedChange={handleActiveToggle}
                    disabled={activeLoading}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role Management Card — ADMIN only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  권한 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex flex-wrap gap-6">
                    {ASSIGNABLE_ROLES.map((role) => (
                      <div key={role} className="flex items-center gap-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <Label
                          htmlFor={`role-${role}`}
                          className="cursor-pointer"
                        >
                          <Badge variant={getRoleBadgeVariant(role)}>
                            {getRoleLabel(role)}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={handleRoleSave}
                    disabled={roleLoading}
                    className="ml-auto"
                  >
                    {roleLoading ? "저장 중..." : "저장"}
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Activity Applications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                활동 신청 내역
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "all" | "completed")}
              >
                <TabsList className="mb-6">
                  <TabsTrigger value="all" className="gap-2">
                    전체 활동
                    <Badge variant="secondary" className="text-xs">
                      {participants.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-2">
                    수료 활동
                    <Badge variant="secondary" className="text-xs">
                      {completedCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  {participants.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">활동 신청 내역이 없습니다</p>
                      <p className="text-sm">
                        활동을 신청하면 이곳에 표시됩니다
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(participantsByQuarter).map(
                        ([quarter, quarterParticipants]) => (
                          <div key={quarter}>
                            {/* Quarter Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-xs">
                                {quarter}
                              </Badge>
                              <Separator className="flex-1" />
                            </div>

                            {/* Applications Table */}
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-b">
                                    <TableHead className="w-[30%]">
                                      활동명
                                    </TableHead>
                                    <TableHead className="text-center w-[12%]">
                                      유형
                                    </TableHead>
                                    <TableHead className="w-[18%]">
                                      활동 기간
                                    </TableHead>
                                    <TableHead className="text-center w-[12%]">
                                      신청 상태
                                    </TableHead>
                                    <TableHead className="text-center w-[12%]">
                                      수료
                                    </TableHead>
                                    <TableHead className="text-right w-[16%]">
                                      신청일
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {quarterParticipants.map((participant) => (
                                    <TableRow
                                      key={participant.id}
                                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                                      onClick={() =>
                                        handleActivityClick(
                                          participant.activity?.id,
                                        )
                                      }
                                    >
                                      <TableCell className="font-semibold">
                                        {participant.activity?.title || "—"}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {participant.activity?.activityType
                                            ?.name || "—"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {participant.activity?.startDate &&
                                        participant.activity?.endDate
                                          ? `${formatDate(participant.activity.startDate)} ~ ${formatDate(participant.activity.endDate)}`
                                          : "—"}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          variant={getStatusBadgeVariant(
                                            participant.status,
                                          )}
                                        >
                                          {getStatusLabel(participant.status)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          variant={
                                            participant.completed
                                              ? "default"
                                              : "secondary"
                                          }
                                        >
                                          {participant.completed
                                            ? "수료"
                                            : "미수료"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right text-sm text-muted-foreground">
                                        {formatDateTime(participant.createdAt)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                  {completedCount === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">수료한 활동이 없습니다</p>
                      <p className="text-sm">
                        활동을 수료하면 이곳에 표시됩니다
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(participantsByQuarter).map(
                        ([quarter, quarterParticipants]) => (
                          <div key={quarter}>
                            {/* Quarter Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-xs">
                                {quarter}
                              </Badge>
                              <Separator className="flex-1" />
                            </div>

                            {/* Applications Table */}
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-b">
                                    <TableHead className="w-[30%]">
                                      활동명
                                    </TableHead>
                                    <TableHead className="text-center w-[12%]">
                                      유형
                                    </TableHead>
                                    <TableHead className="w-[18%]">
                                      활동 기간
                                    </TableHead>
                                    <TableHead className="text-center w-[12%]">
                                      신청 상태
                                    </TableHead>
                                    <TableHead className="text-center w-[12%]">
                                      수료
                                    </TableHead>
                                    <TableHead className="text-right w-[16%]">
                                      신청일
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {quarterParticipants.map((participant) => (
                                    <TableRow
                                      key={participant.id}
                                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                                      onClick={() =>
                                        handleActivityClick(
                                          participant.activity?.id,
                                        )
                                      }
                                    >
                                      <TableCell className="font-semibold">
                                        {participant.activity?.title || "—"}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {participant.activity?.activityType
                                            ?.name || "—"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {participant.activity?.startDate &&
                                        participant.activity?.endDate
                                          ? `${formatDate(participant.activity.startDate)} ~ ${formatDate(participant.activity.endDate)}`
                                          : "—"}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          variant={getStatusBadgeVariant(
                                            participant.status,
                                          )}
                                        >
                                          {getStatusLabel(participant.status)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          variant={
                                            participant.completed
                                              ? "default"
                                              : "secondary"
                                          }
                                        >
                                          {participant.completed
                                            ? "수료"
                                            : "미수료"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right text-sm text-muted-foreground">
                                        {formatDateTime(participant.createdAt)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
