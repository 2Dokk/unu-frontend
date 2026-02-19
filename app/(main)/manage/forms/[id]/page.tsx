"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { getFormById, deleteForm } from "@/lib/api/form";
import { FormResponse } from "@/lib/interfaces/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/utils/date-utils";

export default function ViewFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [form, setForm] = useState<FormResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadForm();
  }, [id]);

  async function loadForm() {
    try {
      setIsLoading(true);
      const data = await getFormById(id);
      setForm(data);
    } catch (error) {
      console.error("Failed to load form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteForm(id);
      router.push("/manage/forms");
    } catch (error) {
      console.error("Failed to delete form:", error);
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
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
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

  if (!form) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">신청서를 찾을 수 없어요.</p>
          <Button className="mt-4" onClick={() => router.push("/manage/forms")}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
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
          <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/manage/forms/${id}/edit`)}
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
      </div>
      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="applications">신청 내역</TabsTrigger>
        </TabsList>

        {/* Tab 1: 기본 정보 */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
                <div className="text-sm font-medium text-muted-foreground">
                  신청서 제목
                </div>
                <div className="text-sm">{form.title}</div>
                <div className="text-sm font-medium text-muted-foreground">
                  신청서 템플릿
                </div>
                <div className="text-sm">{form.template.title}</div>
              </div>
            </CardContent>
          </Card>

          {/* Schema and Preview */}
          <Card>
            <CardHeader>
              <CardTitle>신청서 구조 및 미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">미리보기</h3>
                  <ScrollArea className="h-[600px] w-full">
                    <FormPreview schema={parseSchema(form.schema)} />
                  </ScrollArea>
                </div>
                {/* Schema JSON */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">스키마 (JSON)</h3>
                  <ScrollArea className="h-[600px] w-full rounded-md border bg-muted/50">
                    <pre className="p-4 text-sm font-mono">{form.schema}</pre>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>메타 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
                <div className="text-sm font-medium text-muted-foreground">
                  생성일
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(form.createdAt)}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  수정일
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(form.modifiedAt)}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  생성자
                </div>
                <div className="text-sm text-muted-foreground">
                  {form.createdBy || "알 수 없음"}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  수정자
                </div>
                <div className="text-sm text-muted-foreground">
                  {form.modifiedBy || "알 수 없음"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              신청서 "{form.title}"을(를) 삭제하면 되돌릴 수 없어요.
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
