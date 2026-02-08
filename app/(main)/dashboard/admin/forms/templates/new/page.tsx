"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FormBuilder } from "@/components/custom/form/form-builder";
import { createFormTemplate } from "@/lib/api/form-template";
import { serializeSchema } from "@/lib/interfaces/form-builder";

export default function NewFormTemplatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [schema, setSchema] = useState(
    serializeSchema({ version: 1, questions: [] }),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !schema.trim()) return;

    try {
      setIsSubmitting(true);
      await createFormTemplate({ title, schema });
      router.push("/dashboard/admin/forms");
    } catch (error) {
      console.error("Failed to create template:", error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">새 템플릿 만들기</h1>
        <p className="text-muted-foreground mt-2">
          재사용 가능한 폼 템플릿을 생성하세요
        </p>
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

        <div className="flex justify-end gap-3 mt-6">
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
      </form>
    </div>
  );
}
