"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      router.push("/dashboard/admin/forms");
    } catch (error) {
      console.error("Failed to delete template:", error);
      setDeleteDialogOpen(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{template.title}</h1>
          <p className="text-muted-foreground mt-2">템플릿 상세 정보</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/admin/forms/templates/${id}/edit`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">생성일</p>
                <p className="font-medium">{formatDate(template.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">수정일</p>
                <p className="font-medium">{formatDate(template.modifiedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">생성자</p>
                <p className="font-medium">{template.createdBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">수정자</p>
                <p className="font-medium">{template.modifiedBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schema Card */}
        <Card>
          <CardHeader>
            <CardTitle>스키마</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80 w-full rounded-md border bg-muted/50">
              <pre className="p-4 text-sm font-mono">{template.schema}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start mt-6">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/admin/forms")}
        >
          목록으로 돌아가기
        </Button>
      </div>

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
