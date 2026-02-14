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

type StatusFilter = "all" | "ACCEPTED" | "REJECTED" | "PENDING";

interface ApplicationsTableProps {
  applications: ApplicationResponse[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACCEPTED":
      return <Badge className="bg-green-600 hover:bg-green-700">합격</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">불합격</Badge>;
    case "PENDING":
      return <Badge variant="secondary">대기</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
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
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
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

  async function handleStatusChange(applicationId: number, newStatus: string) {
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
      alert("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  }

  function handleViewDetail(applicationId: number) {
    router.push(`/manage/applications/${applicationId}`);
  }

  // Calculate counts for tabs
  const allCount = applications.length;
  const acceptedCount = applications.filter(
    (app) => app.status === "ACCEPTED",
  ).length;
  const rejectedCount = applications.filter(
    (app) => app.status === "REJECTED",
  ).length;
  const pendingCount = applications.filter(
    (app) => app.status === "PENDING",
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
          <TabsTrigger value="ACCEPTED">합격 ({acceptedCount})</TabsTrigger>
          <TabsTrigger value="REJECTED">불합격 ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="PENDING">대기 ({pendingCount})</TabsTrigger>
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
                <TableRow key={application.id}>
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
                  <TableCell className="text-right py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(application.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        상세
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                처리중
                              </>
                            ) : (
                              "상태 변경"
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(application.id, "ACCEPTED")
                            }
                            disabled={application.status === "ACCEPTED"}
                          >
                            합격
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(application.id, "REJECTED")
                            }
                            disabled={application.status === "REJECTED"}
                          >
                            불합격
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(application.id, "PENDING")
                            }
                            disabled={application.status === "PENDING"}
                          >
                            대기
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
