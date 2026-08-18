"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink,
  FileText,
  FolderOpen,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  createLectureMaterial,
  deleteLectureMaterial,
  getLectureMaterials,
  reorderLectureMaterials,
  updateLectureMaterial,
} from "@/lib/api/lecture-material";
import {
  LectureMaterial,
  LectureMaterialRequest,
} from "@/lib/interfaces/lecture-material";
import { formatDate } from "@/lib/utils/date-utils";
import { isMaterialUrl } from "@/lib/utils/material-url";
import { searchActivities } from "@/lib/api/activity";
import { ActivityResponse } from "@/lib/interfaces/activity";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

const EMPTY_FORM: LectureMaterialRequest = {
  title: "",
  description: "",
  driveUrl: "",
  weekNumber: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  return typeof data === "string" && data.trim() ? data : fallback;
}

function LectureMaterialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const canManage = hasRole("MANAGER");
  const [materials, setMaterials] = useState<LectureMaterial[]>([]);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<LectureMaterial | null>(null);
  const [form, setForm] = useState<LectureMaterialRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LectureMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const handledCreateQuery = useRef(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      // 주차가 지정된 자료는 해당 활동 상세 페이지의 "활동 내용" 탭에서만 보여준다.
      const all = await getLectureMaterials();
      setMaterials(all.filter((material) => material.weekNumber == null));
    } catch (error) {
      toast.error(getErrorMessage(error, "강의자료를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=%2Flecture-materials");
      return;
    }
    void loadMaterials();
    if (canManage) {
      void searchActivities({ includeUnlisted: true })
        .then(setActivities)
        .catch(() => toast.error("활동 목록을 불러오지 못했습니다."));
    }
  }, [authLoading, canManage, isAuthenticated, loadMaterials, router]);

  useEffect(() => {
    if (!canManage || handledCreateQuery.current) return;
    if (searchParams.get("create") !== "true") return;

    handledCreateQuery.current = true;
    setEditingMaterial(null);
    setForm({
      ...EMPTY_FORM,
      activityId: searchParams.get("activityId") ?? undefined,
    });
    setDialogOpen(true);
  }, [canManage, searchParams]);

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
      driveUrl: material.driveUrl,
      weekNumber: material.weekNumber,
      activityId: material.activityId ?? undefined,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("자료 제목을 입력해주세요.");
      return;
    }
    if (!isMaterialUrl(form.driveUrl.trim())) {
      toast.error("Google Drive 또는 Notion 공유 링크를 확인해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const request = {
        title: form.title.trim(),
        description: form.description.trim(),
        driveUrl: form.driveUrl.trim(),
        weekNumber: form.weekNumber || null,
        activityId: form.activityId,
      };
      if (editingMaterial) {
        await updateLectureMaterial(editingMaterial.id, request);
        toast.success("강의자료가 수정되었습니다.");
      } else {
        await createLectureMaterial(request);
        toast.success("강의자료가 등록되었습니다.");
      }
      setDialogOpen(false);
      await loadMaterials();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingMaterial
            ? "강의자료를 수정하지 못했습니다."
            : "강의자료를 등록하지 못했습니다.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function persistOrder(next: LectureMaterial[]) {
    const previous = materials;
    setMaterials(next);
    setSavingOrder(true);
    try {
      await reorderLectureMaterials(next.map((material) => material.id));
    } catch (error) {
      setMaterials(previous);
      toast.error(getErrorMessage(error, "자료 순서를 저장하지 못했습니다."));
    } finally {
      setSavingOrder(false);
    }
  }

  function moveMaterial(from: number, to: number) {
    if (from === to) return;
    const next = [...materials];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistOrder(next);
  }

  function handleDragStart(index: number) {
    dragIndex.current = index;
    setDragOverIndex(index);
  }

  function handleDragEnterItem(index: number) {
    if (dragIndex.current === null) return;
    setDragOverIndex(index);
  }

  function handleDropItem(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null) return;
    moveMaterial(from, index);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOverIndex(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLectureMaterial(deleteTarget.id);
      toast.success("강의자료가 삭제되었습니다.");
      setDeleteTarget(null);
      await loadMaterials();
    } catch (error) {
      toast.error(getErrorMessage(error, "강의자료를 삭제하지 못했습니다."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">강의자료</h1>
          <p className="text-sm text-muted-foreground">
            학회에서 공유하는 강의자료를 확인할 수 있습니다.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog} className="self-start sm:self-auto">
            <Plus className="mr-2 h-4 w-4" />
            자료 추가
          </Button>
        )}
      </header>

      {loading || authLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            자료를 불러오는 중입니다.
          </p>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
          <FolderOpen className="mb-4 h-9 w-9 text-muted-foreground" />
          <p className="font-medium">등록된 강의자료가 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            새로운 자료가 등록되면 이곳에서 확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {canManage && (
            <p className="text-xs text-muted-foreground">
              왼쪽 손잡이를 잡고 위아래로 드래그하면 표시 순서를 바꿀 수 있습니다.
            </p>
          )}
          {materials.map((material, index) => (
            <Card
              key={material.id}
              className={`px-4 py-2.5 transition ${
                canManage ? "select-none" : ""
              } ${
                dragOverIndex === index && dragIndex.current !== null
                  ? "ring-2 ring-[#174b3a]"
                  : ""
              } ${
                dragIndex.current === index ? "opacity-50" : ""
              } ${savingOrder ? "pointer-events-none opacity-70" : ""}`}
              draggable={canManage && !savingOrder}
              onDragStart={
                canManage ? () => handleDragStart(index) : undefined
              }
              onDragEnter={
                canManage ? () => handleDragEnterItem(index) : undefined
              }
              onDragOver={
                canManage ? (event) => event.preventDefault() : undefined
              }
              onDrop={
                canManage
                  ? (event) => {
                      event.preventDefault();
                      handleDropItem(index);
                    }
                  : undefined
              }
              onDragEnd={canManage ? handleDragEnd : undefined}
            >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                {canManage && (
                  <span
                    className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
                    aria-label="드래그하여 순서 변경"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                )}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#edf5f1] text-[#174b3a]">
                  <FileText className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="min-w-0 truncate text-sm font-medium">
                      {material.title}
                    </p>
                    <span className="shrink-0 text-xs font-medium text-[#174b3a]">
                      {material.activityTitle ?? "공용 자료"}
                    </span>
                  </div>

                  <p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">
                    {material.description || "별도의 자료 설명이 없습니다."}
                  </p>
                </div>
              </div>

              {/* 메타/액션: 모바일은 아래 줄(양끝 정렬), 데스크톱은 인라인 */}
              <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end sm:gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatDate(material.createdAt)}
                </span>

                <div className="flex items-center gap-1">
                  {canManage && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(material)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget(material)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}

                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={material.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                    >
                      열기
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !submitting && setDialogOpen(open)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? "강의자료 수정" : "강의자료 추가"}
            </DialogTitle>
            <DialogDescription>
              학회원에게 공유할 Google Drive 또는 Notion 자료를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="material-activity">연결 활동</Label>
              <Select
                value={form.activityId ?? "none"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    activityId: value === "none" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger id="material-activity">
                  <SelectValue placeholder="활동을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">공용 자료</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                활동을 선택하면 해당 활동 상세 페이지에도 자료가 표시됩니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-title">자료 제목</Label>
              <Input
                id="material-title"
                maxLength={120}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="자료 제목"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-description">설명</Label>
              <Textarea
                id="material-description"
                rows={5}
                maxLength={2000}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="자료에 대한 간단한 설명"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-drive-url">자료 링크</Label>
              <Input
                id="material-drive-url"
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
                placeholder="Google Drive·Docs 또는 Notion 공유 링크"
              />
              <p className="text-xs text-muted-foreground">
                학회원이 열람할 수 있도록 공유 권한을 확인해주세요.
              </p>
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
            <AlertDialogTitle>강의자료를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title} 자료가 목록에서 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
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
    </div>
  );
}

export default function LectureMaterialsPage() {
  return (
    <Suspense fallback={null}>
      <LectureMaterialsContent />
    </Suspense>
  );
}
