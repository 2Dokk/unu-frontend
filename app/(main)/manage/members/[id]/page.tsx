"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar } from "lucide-react";
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
import { getUserById } from "@/lib/api/user";
import { getActivityParticipantsByUserId } from "@/lib/api/activity-participant";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";

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

function getRoleLabel(role?: string): string {
  switch (role) {
    case "ADMIN":
      return "관리자";
    case "MANAGER":
      return "매니저";
    case "MEMBER":
      return "회원";
    default:
      return "미지정";
  }
}

function getRoleBadgeVariant(
  role?: string,
): "destructive" | "default" | "secondary" | "outline" {
  switch (role) {
    case "ADMIN":
      return "destructive";
    case "MANAGER":
      return "default";
    case "MEMBER":
      return "secondary";
    default:
      return "outline";
  }
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

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = parseInt(params.id as string);

  const [member, setMember] = useState<UserResponseDto | null>(null);
  const [participants, setParticipants] = useState<
    ActivityParticipantResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "completed">("all");

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

  const handleActivityClick = (activityId?: number) => {
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header with Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/manage/members")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>

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
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
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
                        <p className="font-medium">{member.joinedQuarter}</p>
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
