"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, PenLine, File } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormPreview } from "@/components/custom/form/form-preview";
import { getFormById } from "@/lib/api/form";
import { FormResponse } from "@/lib/interfaces/form";
import { parseSchema } from "@/lib/interfaces/form-builder";

export default function FormViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFormById(id)
      .then(setForm)
      .catch((error: any) => console.error("Failed to load form:", error))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-8 text-center">
        <p className="text-muted-foreground">신청서를 찾을 수 없습니다</p>
        <Button className="mt-4" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  const schema = parseSchema(form.schema);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{form.title}</h1>
        {form.template && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <File className="h-3.5 w-3.5" />
            <span>{form.template.title}</span>
          </div>
        )}
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            신청서 미리보기
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schema.questions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              질문이 없습니다
            </p>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <FormPreview schema={schema} />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Submit CTA */}
      <Button
        className="w-full"
        size="lg"
        disabled={schema.questions.length === 0}
        onClick={() => router.push(`/forms/${id}/submit`)}
      >
        <PenLine className="mr-2 h-4 w-4" />
        신청서 작성하기
      </Button>
    </div>
  );
}
