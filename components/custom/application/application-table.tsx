"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationResponse } from "@/lib/interfaces/application";
import { reviewApplication } from "@/lib/api/application";
import ApplicationStatusDropdown from "./application-status-dropdown";
import { toast } from "sonner";

type StatusFilter = "all" | "PASSED" | "REJECTED" | "WAITING";

interface ApplicationsTableProps {
  applications: ApplicationResponse[];
}

// Helper function to determine if status is in waiting group
function isWaitingStatus(status: string): boolean {
  return ["APPLIED", "IN_PROGRESS", "WAITING", "HOLD"].includes(status);
}

// Helper function to get status group for filtering
function getStatusGroup(
  status: string,
): "PASSED" | "REJECTED" | "WAITING" | "CANCELED" {
  if (status === "PASSED") return "PASSED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "CANCELED") return "CANCELED";
  return "WAITING";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PASSED":
      return <Badge className="bg-green-600 hover:bg-green-700">합격</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">불합격</Badge>;
    case "APPLIED":
      return <Badge variant="secondary">신청</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="secondary">검토중</Badge>;
    case "WAITING":
      return <Badge variant="secondary">대기</Badge>;
    case "HOLD":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
          보류
        </Badge>
      );
    case "CANCELED":
      return <Badge variant="outline">취소</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    APPLIED: "신청",
    IN_PROGRESS: "검토중",
    WAITING: "대기",
    HOLD: "보류",
    PASSED: "합격",
    REJECTED: "불합격",
    CANCELED: "취소",
  };
  return statusMap[status] || status;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ApplicationsTable({
  applications: initialApplications,
}: ApplicationsTableProps) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== "all") {
        const group = getStatusGroup(app.status);
        if (statusFilter === "WAITING") {
          if (group !== "WAITING") return false;
        } else if (group !== statusFilter) {
          return false;
        }
      }

      // Search filter (name or student ID)
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          app.name.toLowerCase().includes(searchLower) ||
          app.studentId.includes(search)
        );
      }

      return true;
    });
  }, [applications, statusFilter, search]);

  async function handleStatusChange(applicationId: string, newStatus: string) {
    // Optimistic update
    setUpdatingIds((prev) => new Set(prev).add(applicationId));

    try {
      const updated = await reviewApplication(applicationId, newStatus);

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? updated : app)),
      );
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast.error("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  }

  function handleViewDetail(applicationId: string) {
    router.push(`/manage/applications/${applicationId}`);
  }

  // Calculate counts for tabs (exclude CANCELED from total)
  const allCount = applications.filter(
    (app) => app.status !== "CANCELED",
  ).length;
  const acceptedCount = applications.filter(
    (app) => app.status === "PASSED",
  ).length;
  const rejectedCount = applications.filter(
    (app) => app.status === "REJECTED",
  ).length;
  const waitingCount = applications.filter((app) =>
    isWaitingStatus(app.status),
  ).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="이름 또는 학번으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabs for status filter */}
      <Tabs
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">전체 ({allCount})</TabsTrigger>
          <TabsTrigger value="PASSED">합격 ({acceptedCount})</TabsTrigger>
          <TabsTrigger value="REJECTED">불합격 ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="WAITING">대기 ({waitingCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>지원자가 없습니다.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[10%]">이름</TableHead>
              <TableHead className="w-[10%]">학번</TableHead>
              <TableHead className="w-[14%]">전공</TableHead>
              <TableHead className="w-[16%]">이메일</TableHead>
              <TableHead className="w-[10%] text-center">상태</TableHead>
              <TableHead className="w-[25%] text-center">지원일</TableHead>
              <TableHead className="w-[25%] text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((application) => {
              const isUpdating = updatingIds.has(application.id);

              return (
                <TableRow
                  key={application.id}
                  onClick={() => {
                    router.push(`/manage/applications/${application.id}`);
                  }}
                >
                  <TableCell className="font-medium text-sm py-4">
                    {application.name}
                  </TableCell>
                  <TableCell className="text-sm py-4 text-muted-foreground">
                    {application.studentId}
                  </TableCell>
                  <TableCell className="text-sm py-4">
                    <div className="max-w-50">
                      <p className="truncate">{application.major}</p>
                      {application.subMajor && (
                        <p className="text-xs text-muted-foreground truncate">
                          {application.subMajor}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm py-4 text-muted-foreground max-w-45">
                    <span className="truncate block">{application.email}</span>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {getStatusBadge(application.status)}
                  </TableCell>
                  <TableCell className="text-sm py-4 text-muted-foreground text-center">
                    {formatDate(application.createdAt)}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <ApplicationStatusDropdown
                      applicationId={application.id}
                      currentStatus={application.status}
                      onStatusChange={handleStatusChange}
                      isUpdating={isUpdating}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
