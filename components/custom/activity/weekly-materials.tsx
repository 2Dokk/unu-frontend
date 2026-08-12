"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  createLectureMaterial,
  deleteLectureMaterial,
  updateLectureMaterial,
} from "@/lib/api/lecture-material";
import {
  LectureMaterial,
  LectureMaterialRequest,
} from "@/lib/interfaces/lecture-material";
import { isGoogleDriveUrl } from "@/lib/utils/drive-url";
import { cn } from "@/lib/utils";

const EMPTY_FORM: LectureMaterialRequest = {
  title: "",
  description: "",
  materialName: "",
  driveUrl: "",
  weekNumber: null,
};

const WEEK_OPTIONS = Array.from({ length: 16 }, (_, index) => index + 1);

interface WeekGroup {
  week: number;
  materials: LectureMaterial[];
}

function groupByWeek(materials: LectureMaterial[]): WeekGroup[] {
  const byWeek = new Map<number, LectureMaterial[]>();
  for (const material of materials) {
    if (material.weekNumber == null) continue;
    const group = byWeek.get(material.weekNumber) ?? [];
    group.push(material);
    byWeek.set(material.weekNumber, group);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, weekMaterials]) => ({ week, materials: weekMaterials }));
}

function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  return typeof data === "string" && data.trim() ? data : fallback;
}

interface Props {
  activityId: string;
  materials: LectureMaterial[];
  /** 주차 자료를 추가할 수 있는지 */
  canManage?: boolean;
  /** 기존 주차 자료를 수정·삭제할 수 있는지 */
  canModify?: boolean;
  /** 추가·수정·삭제 후 부모가 목록을 다시 불러오도록 */
  onChanged: () => void | Promise<void>;
}

export function WeeklyMaterials({
  activityId,
  materials,
  canManage = false,
  canModify = false,
  onChanged,
}: Props) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LectureMaterial | null>(
    null,
  );
  const [form, setForm] = useState<LectureMaterialRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LectureMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const weekGroups = groupByWeek(materials);

  function toggleWeek(week: number) {
    setExpandedWeeks((current) => {
      const next = new Set(current);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  function openCreateDialog() {
    setEditingMaterial(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(material: LectureMaterial) {
    setEditingMaterial(material);
    setForm({
      title: material.title,
      description: material.description ?? "",
      materialName: material.materialName ?? "",
      driveUrl: material.driveUrl,
      weekNumber: material.weekNumber,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.weekNumber || form.weekNumber < 1) {
      toast.error("주차를 입력해주세요.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("내용 이름을 입력해주세요.");
      return;
    }
    if (!isGoogleDriveUrl(form.driveUrl.trim())) {
      toast.error("Google Drive 공유 링크를 확인해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const request = {
        title: form.title.trim(),
        description: form.description.trim(),
        materialName: form.materialName?.trim() || null,
        driveUrl: form.driveUrl.trim(),
        weekNumber: form.weekNumber,
        activityId,
      };
      if (editingMaterial) {
        await updateLectureMaterial(editingMaterial.id, request);
        toast.success("활동 내용이 수정되었습니다.");
      } else {
        await createLectureMaterial(request);
        toast.success("활동 내용이 등록되었습니다.");
      }
      setExpandedWeeks((current) => new Set(current).add(form.weekNumber!));
      setDialogOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingMaterial
            ? "활동 내용을 수정하지 못했습니다."
            : "활동 내용을 등록하지 못했습니다.",
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
      await deleteLectureMaterial(deleteTarget.id);
      toast.success("활동 내용이 삭제되었습니다.");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error, "활동 내용을 삭제하지 못했습니다."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-md font-semibold">활동 내용</CardTitle>
          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-[#174b3a] hover:text-[#174b3a]"
              onClick={openCreateDialog}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              내용 추가
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          {weekGroups.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              등록된 주차별 강의 내용이 없습니다.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {weekGroups.map(({ week, materials: weekMaterials }) => {
                const isOpen = expandedWeeks.has(week);
                return (
                  <div key={week} className="py-1">
                    <button
                      type="button"
                      onClick={() => toggleWeek(week)}
                      className="flex w-full items-center gap-3 py-3 text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#edf5f1] text-[#174b3a]">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span className="min-w-0 flex-1 text-sm font-semibold">
                        {week}주차
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {weekMaterials.length}개
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="space-y-3 pb-4 pl-12">
                        {weekMaterials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">
                                {material.title}
                              </p>
                              {material.description && (
                                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                  {material.description}
                                </p>
                              )}
                              <a
                                href={material.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#174b3a] hover:underline"
                              >
                                <span className="truncate">
                                  {material.materialName || material.title}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              </a>
                            </div>
                            {canModify && (
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={`${material.title} 수정`}
                                  title="수정"
                                  onClick={() => openEditDialog(material)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={`${material.title} 삭제`}
                                  title="삭제"
                                  onClick={() => setDeleteTarget(material)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
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
            <DialogTitle>
              {editingMaterial ? "활동 내용 수정" : "활동 내용 추가"}
            </DialogTitle>
            <DialogDescription>
              주차를 선택하고 해당 주차에 다루는 내용과 자료를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="weekly-material-week">주차</Label>
              <Select
                value={form.weekNumber ? String(form.weekNumber) : ""}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    weekNumber: Number(value),
                  }))
                }
              >
                <SelectTrigger id="weekly-material-week" className="w-full">
                  <SelectValue placeholder="주차를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_OPTIONS.map((week) => (
                    <SelectItem key={week} value={String(week)}>
                      {week}주차
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-material-title">내용 이름</Label>
              <Input
                id="weekly-material-title"
                maxLength={120}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-material-description">설명</Label>
              <Textarea
                id="weekly-material-description"
                rows={4}
                maxLength={2000}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="이번 주차에 다루는 내용을 간단히 설명해주세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-material-name">자료 이름</Label>
              <Input
                id="weekly-material-name"
                maxLength={120}
                value={form.materialName ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    materialName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-material-drive-url">링크</Label>
              <Input
                id="weekly-material-drive-url"
                type="url"
                maxLength={2048}
                autoComplete="off"
                value={form.driveUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    driveUrl: event.target.value,
                  }))
                }
                placeholder="https://drive.google.com/..."
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
            <AlertDialogTitle>활동 내용을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title} 내용이 활동 내용에서 삭제됩니다.
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
