"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  LayoutTemplate,
  Info,
  Database,
  File,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FormPreview } from "@/components/custom/form/form-preview";
import { parseSchema } from "@/lib/interfaces/form-builder";
import {} from "@/components/ui/alert-dialog";
import { DeleteConfirmDialog } from "@/components/custom/common/delete-confirm-dialog";
import { getFormById, deleteForm } from "@/lib/api/form";
import { FormResponse } from "@/lib/interfaces/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/utils/date-utils";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}

export default function ViewFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

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
    } catch (error: any) {
      console.error("Failed to load form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteForm(id);
      router.push("/manage/forms");
    } catch (error: any) {
      console.error("Failed to delete form:", error);
      setDeleteDialogOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        {/* Back button */}
        <Skeleton className="h-9 w-24" />

        {/* Tabs */}
        <div className="space-y-4">
          <Skeleton className="h-9 w-52" />

          {/* 기본 정보 Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 divide-y">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <Skeleton className="h-4 w-4 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 신청서 구조 및 미리보기 Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-96 w-full rounded-md" />
                <Skeleton className="h-96 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>

          {/* 메타 정보 Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">신청서를 찾을 수 없습니다</p>
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
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/manage/forms")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>

        <h1 className="text-xl font-bold tracking-tight">{form.title}</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" className="px-4 py-2">
            기본 정보
          </TabsTrigger>
          <TabsTrigger value="applications" className="px-4 py-2">
            신청 내역
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 기본 정보 */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y">
                <InfoRow
                  icon={<FileText className="h-4 w-4" />}
                  label="신청서 제목"
                  value={form.title}
                />
                <InfoRow
                  icon={<File className="h-4 w-4" />}
                  label="신청서 템플릿"
                  value={form.template?.title}
                />
              </div>
            </CardContent>
          </Card>

          {/* Schema and Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                신청서 구조 및 미리보기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">미리보기</h3>
                  <ScrollArea className="h-150 w-full">
                    <FormPreview schema={parseSchema(form.schema)} />
                  </ScrollArea>
                </div>
                {/* Schema JSON */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">스키마 (JSON)</h3>
                  <ScrollArea className="h-150 w-full rounded-md border bg-muted/50">
                    <pre className="p-4 text-sm font-mono">{form.schema}</pre>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                메타 정보
              </CardTitle>
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
                  {form.createdBy?.name || "알 수 없음"}
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  수정자
                </div>
                <div className="text-sm text-muted-foreground">
                  {form.modifiedBy?.name || "알 수 없음"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(`/manage/forms/${id}/edit`)}
          >
            <Pencil className="h-3 w-3" />
            <span className="text-xs">수정</span>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
            <span className="text-xs">삭제</span>
          </Button>
        </div>
      </Tabs>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemValue={form.title || ""}
        onConfirm={handleDelete}
      />
    </div>
  );
}
