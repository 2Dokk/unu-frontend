"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { getFormById, updateForm, deleteForm } from "@/lib/api/form";
import { FormResponse } from "@/lib/interfaces/form";

export default function EditFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [form, setForm] = useState<FormResponse | null>(null);
  const [title, setTitle] = useState("");
  const [schema, setSchema] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadForm();
  }, [id]);

  async function loadForm() {
    try {
      setIsLoading(true);
      const data = await getFormById(id);
      setForm(data);
      setTitle(data.title);
      setSchema(data.schema);
    } catch (error) {
      console.error("Failed to load form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !title.trim() || !schema.trim()) return;

    try {
      setIsSubmitting(true);
      await updateForm(id, {
        templateId: form.template.id,
        title,
        schema,
      });
      router.push("/dashboard/admin/forms");
    } catch (error) {
      console.error("Failed to update form:", error);
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteForm(id);
      router.push("/dashboard/admin/forms");
    } catch (error) {
      console.error("Failed to delete form:", error);
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
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-65 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto max-w-5xl py-8 px-4">
        <div className="text-center">
          <p className="text-muted-foreground">폼을 찾을 수 없어요.</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/admin/forms")}
          >
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">폼 수정</h1>
        <p className="text-muted-foreground mt-2">폼 정보를 수정하세요</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>폼 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>템플릿</Label>
              <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/50">
                <span className="font-medium">{form.template.title}</span>
                <Badge variant="secondary">ID: {form.template.id}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                템플릿은 수정할 수 없어요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="폼 제목을 입력하세요"
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

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isSubmitting}
          >
            삭제
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/admin/forms")}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
              폼 "{form.title}"을(를) 삭제하면 되돌릴 수 없어요.
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
