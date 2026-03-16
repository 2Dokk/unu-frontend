"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ApplicationResponse } from "@/lib/interfaces/application";
import { reviewApplication } from "@/lib/api/application";
import ApplicationStatusDropdown from "./application-status-dropdown";
import { toast } from "sonner";

const BULK_STATUS_OPTIONS = [
  { value: "APPLIED", label: "신청" },
  { value: "IN_PROGRESS", label: "검토중" },
  { value: "WAITING", label: "대기" },
  { value: "HOLD", label: "보류" },
  { value: "PASSED", label: "합격" },
  { value: "REJECTED", label: "불합격" },
];

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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string>("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

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
    } catch (error: any) {
      console.error("Failed to update application status:", error);
      toast.error(error.response?.data || "상태 변경에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  }

  // Bulk selection helpers
  const filteredIds = filteredApplications.map((a) => a.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  function handleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredIds.forEach((id) => next.add(id));
      } else {
        filteredIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  function handleSelectOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function openBulkStatusDialog(targetStatus: string) {
    setBulkTargetStatus(targetStatus);
    setBulkStatusDialogOpen(true);
  }

  async function handleBulkStatusChange() {
    setBulkUpdating(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          reviewApplication(id, bulkTargetStatus),
        ),
      );
      setApplications((prev) =>
        prev.map((app) => {
          const updated = results.find((r) => r.id === app.id);
          return updated ?? app;
        }),
      );
      setSelectedIds(new Set());
    } catch (error: any) {
      toast.error(error.response?.data || "일괄 상태 변경에 실패했습니다.");
    } finally {
      setBulkUpdating(false);
      setBulkStatusDialogOpen(false);
    }
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
      {/* Filters / Bulk toolbar */}
      <div className="flex items-center gap-3 h-9">
        {selectedIds.size > 0 ? (
          <>
            <span className="text-xs text-muted-foreground font-medium">
              {selectedIds.size}개 선택됨
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="text-xs h-7">
                  상태 변경
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {BULK_STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    className="text-xs"
                    onClick={() => openBulkStatusDialog(opt.value)}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 ml-auto"
              onClick={() => setSelectedIds(new Set())}
            >
              선택 해제
            </Button>
          </>
        ) : (
          <Input
            placeholder="이름 또는 학번으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { value: "all", label: "전체", count: allCount },
          { value: "WAITING", label: "대기", count: waitingCount },
          { value: "PASSED", label: "합격", count: acceptedCount },
          { value: "REJECTED", label: "불합격", count: rejectedCount },
        ].map(({ value, label, count }) => {
          const active = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => {
                setStatusFilter(value as StatusFilter);
                setSelectedIds(new Set());
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {label}
              <span
                className={`tabular-nums ${active ? "text-background/70" : "text-muted-foreground/60"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>지원자가 없습니다</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="w-[10%]">이름</TableHead>
              <TableHead className="w-[10%]">학번</TableHead>
              <TableHead className="w-[14%]">전공</TableHead>
              <TableHead className="w-[16%]">이메일</TableHead>
              <TableHead className="w-[10%] text-center">상태</TableHead>
              <TableHead className="w-[20%] text-center">지원일</TableHead>
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
                  className="cursor-pointer"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(application.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(application.id, !!checked)
                      }
                    />
                  </TableCell>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Bulk Status Change Dialog */}
      <AlertDialog
        open={bulkStatusDialogOpen}
        onOpenChange={setBulkStatusDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상태 일괄 변경</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 지원자 <strong>{selectedIds.size}명</strong>의 상태를{" "}
              <strong>
                {
                  BULK_STATUS_OPTIONS.find((o) => o.value === bulkTargetStatus)
                    ?.label
                }
              </strong>
              (으)로 변경합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkUpdating}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusChange}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? "변경 중..." : "변경"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
