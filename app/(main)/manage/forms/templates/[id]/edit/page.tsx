"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { FormBuilder } from "@/components/custom/form/form-builder";
import {
  getFormTemplateById,
  updateFormTemplate,
  deleteFormTemplate,
} from "@/lib/api/form-template";
import { FormTemplateResponse } from "@/lib/interfaces/form";

export default function EditFormTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [template, setTemplate] = useState<FormTemplateResponse | null>(null);
  const [title, setTitle] = useState("");
  const [schema, setSchema] = useState("");
  const [initialTitle, setInitialTitle] = useState("");
  const [initialSchema, setInitialSchema] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const hasUnsavedChanges = title !== initialTitle || schema !== initialSchema;

  useEffect(() => {
    loadTemplate();
  }, [id]);

  async function loadTemplate() {
    try {
      setIsLoading(true);
      const data = await getFormTemplateById(id);
      setTemplate(data);
      setTitle(data.title);
      setSchema(data.schema);
      setInitialTitle(data.title);
      setInitialSchema(data.schema);
      setLastSaved(new Date(data.modifiedAt));
    } catch (error) {
      console.error("Failed to load template:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !schema.trim()) return;

    try {
      setIsSubmitting(true);
      await updateFormTemplate(id, { title, schema });
      setInitialTitle(title);
      setInitialSchema(schema);
      setLastSaved(new Date());
      router.push("/manage/forms");
    } catch (error) {
      console.error("Failed to update template:", error);
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteFormTemplate(id);
      router.push("/manage/forms");
    } catch (error) {
      console.error("Failed to delete template:", error);
      setDeleteDialogOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl py-8 px-4">
        <Skeleton className="h-12 w-64 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-65 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto max-w-5xl py-8 px-4">
        <div className="text-center">
          <p className="text-muted-foreground">템플릿을 찾을 수 없어요.</p>
          <Button className="mt-4" onClick={() => router.push("/manage/forms")}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      <div className="border-b pb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/manage/forms")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">신청서 템플릿 편집</h1>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              신청서 템플릿을 수정할 수 있습니다.
            </p>
          </div>
          <div className="text-sm text-right">
            {hasUnsavedChanges ? (
              <span className="text-amber-600 font-medium">
                저장되지 않은 변경 사항 있음
              </span>
            ) : lastSaved ? (
              <span className="text-muted-foreground">
                {new Date().getTime() - lastSaved.getTime() < 60000
                  ? "방금 저장됨"
                  : `${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)}분 전 저장됨`}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>템플릿 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="템플릿 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>질문 구성</Label>
              <FormBuilder initialSchema={schema} onChange={setSchema} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isSubmitting}
          >
            삭제
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/manage/forms")}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              템플릿 "{template.title}"을(를) 삭제하면 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
