"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogDescription,
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
  getAllActivityTypes,
  createActivityType,
  updateActivityType,
  deleteActivityType,
} from "@/lib/api/activity-type";
import { ActivityTypeResponse } from "@/lib/interfaces/activity";
import { formatDateTime } from "@/lib/utils/date-utils";

export default function ActivityTypesPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();

  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingType, setEditingType] = useState<ActivityTypeResponse | null>(
    null,
  );
  const [formData, setFormData] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: ActivityTypeResponse | null;
  }>({ open: false, type: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("ADMIN"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && hasRole("ADMIN")) {
      loadActivityTypes();
    }
  }, [isAuthenticated, hasRole]);

  async function loadActivityTypes() {
    setLoading(true);
    try {
      const data = await getAllActivityTypes();
      setActivityTypes(data);
    } catch (error: any) {
      console.error("Failed to load activity types:", error);
      toast.error(error.response?.data || "활동 유형을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateDialog() {
    setEditingType(null);
    setFormData({ name: "" });
    setShowDialog(true);
  }

  function handleOpenEditDialog(type: ActivityTypeResponse) {
    setEditingType(type);
    setFormData({ name: type.name });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error("활동 유형 이름을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingType) {
        await updateActivityType(editingType.id, formData);
        toast.success("활동 유형이 수정되었습니다.");
      } else {
        await createActivityType(formData);
        toast.success("활동 유형이 생성되었습니다.");
      }
      await loadActivityTypes();
      setShowDialog(false);
    } catch (error: any) {
      console.error("Failed to save activity type:", error);
      toast.error(
        error.response?.data || (editingType
          ? "활동 유형 수정에 실패했습니다."
          : "활동 유형 생성에 실패했습니다."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.type) return;

    setDeleting(true);
    try {
      await deleteActivityType(deleteConfirm.type.id);
      toast.success("활동 유형이 삭제되었습니다.");
      await loadActivityTypes();
      setDeleteConfirm({ open: false, type: null });
    } catch (error: any) {
      console.error("Failed to delete activity type:", error);
      toast.error(error.response?.data || "활동 유형 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("ADMIN")) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Button
          onClick={() => router.push("/admin")}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          시스템 관리
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">활동 유형 관리</h1>
        <p className="text-sm text-muted-foreground">
          활동 유형을 생성, 수정, 삭제하고 조회합니다.
        </p>
      </div>

      {/* Activity Types Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>활동 유형 목록</CardTitle>
              <CardDescription>
                총 {activityTypes.length}개의 활동 유형
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />새 유형 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activityTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                등록된 활동 유형이 없습니다
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>코드</TableHead>
                  <TableHead className="w-32">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {type.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEditDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteConfirm({ open: true, type })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "활동 유형 수정" : "새 활동 유형 추가"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "활동 유형 정보를 수정합니다."
                : "새로운 활동 유형을 생성합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">이름</label>
              <Input
                placeholder="예: 대외 활동, 동아리 활동 등"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "저장 중..."
                : editingType
                  ? "수정하기"
                  : "생성하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm({ open, type: deleteConfirm.type })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>활동 유형 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteConfirm.type?.name}</strong>을(를)
              삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
