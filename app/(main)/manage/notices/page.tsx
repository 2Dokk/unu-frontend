"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from "@/lib/api/notice";
import { Notice } from "@/lib/interfaces/notice";
import { formatDateTime } from "@/lib/utils/date-utils";
import { useNoticeUnread } from "@/lib/contexts/NoticeUnreadContext";

function getNoticeErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
    return error.response.data;
  }
  return fallback;
}

export default function NoticesPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const { refresh: refreshUnreadNotices } = useNoticeUnread();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({ title: "", tag: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    notice: Notice | null;
  }>({ open: false, notice: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("MANAGER"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && hasRole("MANAGER")) {
      loadNotices();
    }
  }, [isAuthenticated, hasRole]);

  async function loadNotices() {
    setLoading(true);
    try {
      const data = await getNotices();
      setNotices(data.notices);
    } catch (error) {
      console.error("Failed to load notices:", error);
      toast.error(
        getNoticeErrorMessage(error, "공지를 불러오는데 실패했습니다."),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateDialog() {
    setEditingNotice(null);
    setFormData({ title: "", tag: "", content: "" });
    setShowDialog(true);
  }

  function handleOpenEditDialog(notice: Notice) {
    setEditingNotice(notice);
    setFormData({ title: notice.title, tag: notice.tag, content: notice.content });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!formData.tag.trim()) {
      toast.error("태그를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingNotice) {
        await updateNotice(editingNotice.id, formData);
        toast.success("공지가 수정되었습니다.");
      } else {
        await createNotice(formData);
        toast.success("공지가 등록되었습니다.");
      }
      await Promise.all([loadNotices(), refreshUnreadNotices()]);
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to save notice:", error);
      toast.error(
        getNoticeErrorMessage(
          error,
          editingNotice
            ? "공지 수정에 실패했습니다."
            : "공지 등록에 실패했습니다.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.notice) return;

    setDeleting(true);
    try {
      await deleteNotice(deleteConfirm.notice.id);
      toast.success("공지가 삭제되었습니다.");
      await Promise.all([loadNotices(), refreshUnreadNotices()]);
      setDeleteConfirm({ open: false, notice: null });
    } catch (error) {
      console.error("Failed to delete notice:", error);
      toast.error(getNoticeErrorMessage(error, "공지 삭제에 실패했습니다."));
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

  if (!isAuthenticated || !hasRole("MANAGER")) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">공지 관리</h1>
        <p className="text-sm text-muted-foreground">
          홈 화면 학회 소식에 노출되는 공지를 생성, 수정, 삭제합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>공지 목록</CardTitle>
              <CardDescription>총 {notices.length}개의 공지</CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />새 공지 등록
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
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">등록된 공지가 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>태그</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="w-32">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="text-muted-foreground">
                      {notice.tag}
                    </TableCell>
                    <TableCell className="font-medium">{notice.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(notice.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEditDialog(notice)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteConfirm({ open: true, notice })}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNotice ? "공지 수정" : "새 공지 등록"}
            </DialogTitle>
            <DialogDescription>
              {editingNotice
                ? "공지 정보를 수정합니다."
                : "홈 화면에 노출될 새 공지를 작성합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">태그</label>
              <Input
                value={formData.tag}
                onChange={(e) =>
                  setFormData({ ...formData, tag: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">제목</label>
              <Input
                placeholder="공지 제목"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">내용</label>
              <Textarea
                placeholder="공지 상세 내용"
                rows={6}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
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
                : editingNotice
                  ? "수정하기"
                  : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm({ open, notice: deleteConfirm.notice })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteConfirm.notice?.title}</strong>을(를)
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
