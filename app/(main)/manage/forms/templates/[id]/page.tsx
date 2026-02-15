"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Plus, File } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FormPreview } from "@/components/custom/form/form-preview";
import { parseSchema } from "@/lib/interfaces/form-builder";
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
  getFormTemplateById,
  deleteFormTemplate,
} from "@/lib/api/form-template";
import { FormTemplateResponse } from "@/lib/interfaces/form";
import { formatDate } from "@/lib/utils/date-utils";

export default function ViewFormTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [template, setTemplate] = useState<FormTemplateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  async function loadTemplate() {
    try {
      setIsLoading(true);
      const data = await getFormTemplateById(id);
      setTemplate(data);
    } catch (error) {
      console.error("Failed to load template:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteFormTemplate(id);
      router.push("/manage/forms/templates");
    } catch (error) {
      console.error("Failed to delete template:", error);
      setDeleteDialogOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Skeleton className="h-12 w-64 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-65 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
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
    <div className="space-y-6 p-8">
      {/* Header with Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/manage/forms")}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl font-bold">{template.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/manage/forms/templates/${id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <Separator />

      {/* Create Form Action */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">
                이 템플릿으로 신청서 만들기
              </h3>
              <p className="text-sm text-muted-foreground">
                현재 템플릿을 기반으로 새로운 신청서를 생성할 수 있습니다
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => router.push(`/manage/forms/new?templateId=${id}`)}
            >
              <File className="mr-2 h-4 w-4" />
              신청서 생성
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schema and Preview */}
      <Card>
        <CardHeader>
          <CardTitle>템플릿 구조 및 미리보기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">미리보기</h3>
              <ScrollArea className="h-150 w-full">
                <FormPreview schema={parseSchema(template.schema)} />
              </ScrollArea>
            </div>
            {/* Schema JSON */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">스키마 (JSON)</h3>
              <ScrollArea className="h-150 w-full rounded-md border bg-muted/50">
                <pre className="p-4 text-sm font-mono">{template.schema}</pre>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

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
