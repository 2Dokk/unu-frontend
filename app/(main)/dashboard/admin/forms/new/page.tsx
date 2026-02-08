"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FormBuilder } from "@/components/custom/form/form-builder";
import { createForm } from "@/lib/api/form";
import { getAllFormTemplates } from "@/lib/api/form-template";
import { FormTemplateResponse } from "@/lib/interfaces/form";
import { serializeSchema } from "@/lib/interfaces/form-builder";

export default function NewFormPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplateResponse[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [schema, setSchema] = useState(
    serializeSchema({ version: 1, questions: [] }),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setTemplatesLoading(true);
      const data = await getAllFormTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setTemplatesLoading(false);
    }
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === Number(templateId));
    if (template) {
      setSchema(template.schema);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplateId || !title.trim() || !schema.trim()) return;

    try {
      setIsSubmitting(true);
      await createForm({
        templateId: Number(selectedTemplateId),
        title,
        schema,
      });
      router.push("/dashboard/admin/forms");
    } catch (error) {
      console.error("Failed to create form:", error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">새 폼 만들기</h1>
        <p className="text-muted-foreground mt-2">
          템플릿을 선택하여 새로운 폼을 생성하세요
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>폼 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="template">템플릿 선택</Label>
              {templatesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateChange}
                  required
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="템플릿을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-muted-foreground">
                템플릿을 선택하면 질문이 자동으로 채워져요.
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
            {isSubmitting ? "생성 중..." : "폼 생성"}
          </Button>
        </div>
      </form>
    </div>
  );
}
