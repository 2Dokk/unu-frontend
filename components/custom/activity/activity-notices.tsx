"use client";

import { useState } from "react";
import {
  ChevronDown,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  createActivityNotice,
  deleteActivityNotice,
  updateActivityNotice,
} from "@/lib/api/activity-notice";
import { ActivityNotice } from "@/lib/interfaces/activity-notice";
import { formatDate } from "@/lib/utils/date-utils";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  return typeof data === "string" && data.trim() ? data : fallback;
}

interface Props {
  activityId: string;
  notices: ActivityNotice[];
  /** 공지를 등록할 수 있는지 */
  canManage?: boolean;
  /** 기존 공지를 수정·삭제할 수 있는지 */
  canModify?: boolean;
  /** 등록·수정·삭제 후 부모가 목록을 다시 불러오도록 */
  onChanged: () => void | Promise<void>;
}

export function ActivityNotices({
  activityId,
  notices,
  canManage = false,
  canModify = false,
  onChanged,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<ActivityNotice | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivityNotice | null>(null);
  const [deleting, setDeleting] = useState(false);

  function toggleNotice(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreateDialog() {
    setEditingNotice(null);
    setForm({ title: "", content: "" });
    setDialogOpen(true);
  }

  function openEditDialog(notice: ActivityNotice) {
    setEditingNotice(notice);
    setForm({ title: notice.title, content: notice.content ?? "" });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("공지 제목을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const request = {
        activityId,
        title: form.title.trim(),
        content: form.content.trim(),
      };
      if (editingNotice) {
        await updateActivityNotice(editingNotice.id, request);
        toast.success("공지가 수정되었습니다.");
      } else {
        await createActivityNotice(request);
        toast.success("공지가 등록되었습니다.");
      }
      setDialogOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingNotice
            ? "공지를 수정하지 못했습니다."
            : "공지를 등록하지 못했습니다.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteActivityNotice(deleteTarget.id);
      toast.success("공지가 삭제되었습니다.");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error, "공지를 삭제하지 못했습니다."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-md font-semibold">공지</CardTitle>
          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-[#174b3a] hover:text-[#174b3a]"
              onClick={openCreateDialog}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              공지 추가
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          {notices.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              등록된 공지가 없습니다.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {notices.map((notice) => {
                const isOpen = expandedIds.has(notice.id);
                return (
                  <div key={notice.id} className="py-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleNotice(notice.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#edf5f1] text-[#174b3a]">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {notice.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(notice.createdAt)}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                      {canModify && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`${notice.title} 수정`}
                            title="수정"
                            onClick={() => openEditDialog(notice)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`${notice.title} 삭제`}
                            title="삭제"
                            onClick={() => setDeleteTarget(notice)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {isOpen && (
                      <div className="pb-4 pl-12">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {notice.content || "내용이 없습니다."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !submitting && setDialogOpen(open)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNotice ? "공지 수정" : "공지 추가"}</DialogTitle>
            <DialogDescription>
              이 활동의 참여자에게 전달할 공지를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="activity-notice-title">제목</Label>
              <Input
                id="activity-notice-title"
                maxLength={120}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="예: 이번 주 모임 장소 변경 안내"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-notice-content">내용</Label>
              <Textarea
                id="activity-notice-content"
                rows={6}
                maxLength={5000}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                placeholder="공지 내용을 입력해주세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
            <Button type="button" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title} 공지가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
