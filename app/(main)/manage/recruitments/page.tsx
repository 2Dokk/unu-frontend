"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Clock,
  SquarePlus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { getAllRecruitments, deleteRecruitment } from "@/lib/api/recruitment";
import { getAllForms } from "@/lib/api/form";
import { getAllQuarters } from "@/lib/api/quarter";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import { FormResponse } from "@/lib/interfaces/form";
import { QuarterResponse } from "@/lib/interfaces/quarter";

type RecruitmentStatus = "전체" | "모집중" | "예정" | "마감";
type ActiveFilter = "전체" | "활성" | "비활성";

export default function AdminRecruitmentsPage() {
  const router = useRouter();

  // Data state
  const [recruitments, setRecruitments] = useState<RecruitmentResponse[]>([]);
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RecruitmentStatus>("전체");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("전체");

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [recruitmentsData, formsData, quartersData] = await Promise.all([
        getAllRecruitments(),
        getAllForms(),
        getAllQuarters(),
      ]);
      setRecruitments(recruitmentsData);
      setForms(formsData);
      setQuarters(quartersData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getRecruitmentStatus(
    recruitment: RecruitmentResponse,
  ): RecruitmentStatus {
    const now = new Date();
    const start = new Date(recruitment.startAt);
    const end = new Date(recruitment.endAt);

    if (now < start) return "예정";
    if (now > end) return "마감";
    return "모집중";
  }

  function getFormTitle(formId: string): string {
    const form = forms.find((f) => f.id === formId);
    return form?.title || `Form #${formId}`;
  }

  function getQuarterLabel(quarterId: string): string {
    const quarter = quarters.find((q) => q.id === quarterId);
    return quarter ? `${quarter.year}년 ${quarter.name}분기` : `Q${quarterId}`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filteredRecruitments = recruitments.filter((recruitment) => {
    // Search filter
    if (
      search &&
      !recruitment.title.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    // Active filter
    if (activeFilter === "활성" && !recruitment.active) return false;
    if (activeFilter === "비활성" && recruitment.active) return false;

    // Status filter
    if (statusFilter !== "전체") {
      const status = getRecruitmentStatus(recruitment);
      if (status !== statusFilter) return false;
    }

    return true;
  });

  function getStatusBadge(recruitment: RecruitmentResponse) {
    const status = getRecruitmentStatus(recruitment);

    if (status === "모집중") {
      return <Badge className="bg-green-500">모집중</Badge>;
    }
    if (status === "예정") {
      return <Badge variant="secondary">예정</Badge>;
    }
    return <Badge variant="outline">마감</Badge>;
  }
  function confirmDelete(id: string, title: string) {
    setItemToDelete({ id, title });
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!itemToDelete) return;
    try {
      await deleteRecruitment(itemToDelete.id);
      setRecruitments((prev) => prev.filter((r) => r.id !== itemToDelete.id));
    } catch (error) {
      console.error("Failed to delete recruitment:", error);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">모집 관리</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          모든 모집 공고를 조회하고 상태를 관리합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>모집 목록</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/manage/recruitments/new")}
            >
              <SquarePlus className="mr-1 h-4 w-4" />새 모집 생성
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="모집 제목 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as RecruitmentStatus)
              }
            >
              <SelectTrigger className="w-full md:w-35">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체 상태</SelectItem>
                <SelectItem value="모집중">모집중</SelectItem>
                <SelectItem value="예정">예정</SelectItem>
                <SelectItem value="마감">마감</SelectItem>
              </SelectContent>
            </Select>

            {/* Active Filter */}
            <Select
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value as ActiveFilter)}
            >
              <SelectTrigger className="w-full md:w-35">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체</SelectItem>
                <SelectItem value="활성">활성</SelectItem>
                <SelectItem value="비활성">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRecruitments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search || statusFilter !== "전체" || activeFilter !== "전체"
                ? "검색 결과가 없어요."
                : "아직 모집이 없어요."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-25">상태</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead className="hidden md:table-cell">기간</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      연결된 폼
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">분기</TableHead>
                    <TableHead className="hidden xl:table-cell">
                      생성일
                    </TableHead>
                    <TableHead className="w-20">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecruitments.map((recruitment) => (
                    <TableRow
                      key={recruitment.id}
                      onClick={() =>
                        router.push(`/manage/recruitments/${recruitment.id}`)
                      }
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(recruitment)}
                          {!recruitment.active && (
                            <Badge variant="secondary" className="text-xs">
                              비활성
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{recruitment.title}</div>
                        {recruitment.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-75">
                            {recruitment.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDate(recruitment.startAt)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            ~ {formatDate(recruitment.endAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {recruitment.form.title}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {recruitment.quarter.name}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                        {formatDate(recruitment.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/manage/recruitments/${recruitment.id}/edit`,
                                );
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                confirmDelete(
                                  recruitment.id,
                                  recruitment.title,
                                );
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              모집 공고 "{itemToDelete?.title}"을(를) 삭제하면 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
