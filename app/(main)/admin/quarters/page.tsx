"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Star,
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  CalendarRange,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllQuarters,
  createQuarter,
  updateQuarter,
  deleteQuarter,
  getCurrentQuarter,
  updateCurrentQuarter,
} from "@/lib/api/quarter";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { formatDate } from "@/lib/utils/date-utils";
import { DatePicker } from "@/components/ui/date-picker";

const SEASONS = [
  { value: "Spring", label: "봄", Icon: Flower2, color: "text-pink-500" },
  { value: "Summer", label: "여름", Icon: Sun, color: "text-amber-500" },
  { value: "Fall", label: "가을", Icon: Leaf, color: "text-orange-500" },
  { value: "Winter", label: "겨울", Icon: Snowflake, color: "text-sky-500" },
];

function SeasonIcon({ season, className }: { season: string; className?: string }) {
  const s = SEASONS.find((s) => s.value === season);
  if (!s) return <CalendarRange className={className} />;
  return <s.Icon className={`${s.color} ${className ?? ""}`} />;
}

export default function QuartersPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();

  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<QuarterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingQuarter, setEditingQuarter] = useState<QuarterResponse | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    season: "Spring",
    startDate: "",
    endDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    quarter: QuarterResponse | null;
  }>({ open: false, quarter: null });
  const [deleting, setDeleting] = useState(false);
  const [settingCurrent, setSettingCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("ADMIN"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && hasRole("ADMIN")) loadData();
  }, [isAuthenticated, hasRole]);

  async function loadData() {
    setLoading(true);
    try {
      const [quartersData, currentData] = await Promise.all([
        getAllQuarters(),
        getCurrentQuarter().catch(() => null),
      ]);
      setQuarters(quartersData);
      setCurrentQuarter(currentData);
    } catch (error: any) {
      toast.error(error.response?.data || "분기 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateDialog() {
    setEditingQuarter(null);
    setFormData({ year: new Date().getFullYear(), season: "Spring", startDate: "", endDate: "" });
    setShowDialog(true);
  }

  function handleOpenEditDialog(quarter: QuarterResponse) {
    setEditingQuarter(quarter);
    setFormData({
      year: quarter.year,
      season: quarter.season,
      startDate: quarter.startDate,
      endDate: quarter.endDate,
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!formData.year || !formData.season || !formData.startDate || !formData.endDate) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingQuarter) {
        await updateQuarter(editingQuarter.id, formData);
        toast.success("분기가 수정되었습니다.");
      } else {
        await createQuarter(formData);
        toast.success("분기가 생성되었습니다.");
      }
      await loadData();
      setShowDialog(false);
    } catch (error: any) {
      toast.error(
        error.response?.data ||
          (editingQuarter ? "분기 수정에 실패했습니다." : "분기 생성에 실패했습니다."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.quarter) return;
    setDeleting(true);
    try {
      await deleteQuarter(deleteConfirm.quarter.id);
      toast.success("분기가 삭제되었습니다.");
      await loadData();
      setDeleteConfirm({ open: false, quarter: null });
    } catch (error: any) {
      toast.error(error.response?.data || "분기 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSetCurrentQuarter(quarterId: string) {
    setSettingCurrent(quarterId);
    try {
      await updateCurrentQuarter({ quarterId });
      toast.success("현재 분기가 설정되었습니다.");
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data || "현재 분기 설정에 실패했습니다.");
    } finally {
      setSettingCurrent(null);
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("ADMIN")) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Button
          onClick={() => router.push("/admin")}
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 text-muted-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          시스템 관리
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">분기 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          분기를 생성, 수정, 삭제하고 현재 분기를 지정합니다.
        </p>
      </div>

      {/* Current Quarter Banner */}
      {currentQuarter && (
        <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <SeasonIcon season={currentQuarter.season} className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{currentQuarter.name}</p>
              <Badge variant="default" className="text-[11px] px-1.5 py-0">
                현재 분기
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(currentQuarter.startDate)} – {formatDate(currentQuarter.endDate)}
            </p>
          </div>
          <Star className="h-4 w-4 text-primary fill-primary shrink-0" />
        </div>
      )}

      {/* Quarters Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold">분기 목록</h2>
            <p className="text-xs text-muted-foreground mt-0.5">총 {quarters.length}개</p>
          </div>
          <Button size="sm" onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-1.5" />
            새 분기
          </Button>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : quarters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarRange className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">등록된 분기가 없습니다</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">분기</TableHead>
                <TableHead>기간</TableHead>
                <TableHead className="w-36 text-center">상태</TableHead>
                <TableHead className="w-44 pr-5">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarters.map((quarter) => {
                const isCurrent = currentQuarter?.id === quarter.id;
                return (
                  <TableRow key={quarter.id} className={isCurrent ? "bg-primary/5" : undefined}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <SeasonIcon season={quarter.season} className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{quarter.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(quarter.startDate)} – {formatDate(quarter.endDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      {isCurrent ? (
                        <Badge variant="default" className="text-[11px]">현재 분기</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center gap-1">
                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={() => handleSetCurrentQuarter(quarter.id)}
                            disabled={settingCurrent === quarter.id}
                          >
                            {settingCurrent === quarter.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Star className="h-3.5 w-3.5 mr-1" />
                            )}
                            현재로 설정
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleOpenEditDialog(quarter)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({ open: true, quarter })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingQuarter ? "분기 수정" : "새 분기 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">연도</label>
                <Input
                  type="number"
                  placeholder={String(new Date().getFullYear())}
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">계절</label>
                <Select
                  value={formData.season}
                  onValueChange={(value) => setFormData({ ...formData, season: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASONS.map(({ value, label, Icon, color }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${color}`} />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">시작일</label>
              <DatePicker
                value={formData.startDate}
                onChange={(value) => setFormData({ ...formData, startDate: value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">종료일</label>
              <DatePicker
                value={formData.endDate}
                onChange={(value) => setFormData({ ...formData, endDate: value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : editingQuarter ? (
                "수정하기"
              ) : (
                "생성하기"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, quarter: deleteConfirm.quarter })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>분기 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteConfirm.quarter?.name}</strong>을(를) 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
