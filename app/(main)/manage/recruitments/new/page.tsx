"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRecruitment } from "@/lib/api/recruitment";
import { getAllForms, getFormById } from "@/lib/api/form";
import { getAllQuarters } from "@/lib/api/quarter";
import { FormResponse } from "@/lib/interfaces/form";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import {
  FormSchema,
  parseSchema,
  QUESTION_TYPE_LABELS,
} from "@/lib/interfaces/form-builder";

export default function NewRecruitmentPage() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [quarterId, setQuarterId] = useState("");
  const [formId, setFormId] = useState("");
  const [active, setActive] = useState(true);

  // Data loading
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [quartersLoading, setQuartersLoading] = useState(true);

  // Form preview
  const [selectedForm, setSelectedForm] = useState<FormResponse | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadForms();
    loadQuarters();
  }, []);

  async function loadForms() {
    try {
      setFormsLoading(true);
      const data = await getAllForms();
      setForms(data);
    } catch (error) {
      console.error("Failed to load forms:", error);
    } finally {
      setFormsLoading(false);
    }
  }

  async function loadQuarters() {
    try {
      setQuartersLoading(true);
      const data = await getAllQuarters();
      setQuarters(data);
    } catch (error) {
      console.error("Failed to load quarters:", error);
    } finally {
      setQuartersLoading(false);
    }
  }

  async function handleFormSelect(selectedFormId: string) {
    setFormId(selectedFormId);
    if (!selectedFormId) {
      setSelectedForm(null);
      setFormSchema(null);
      return;
    }

    try {
      setFormLoading(true);
      const form = await getFormById(parseInt(selectedFormId));
      setSelectedForm(form);
      const schema = parseSchema(form.schema);
      setFormSchema(schema);
    } catch (error) {
      console.error("Failed to load form:", error);
      setFormSchema(null);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !formId || !quarterId || !startAt || !endAt) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (new Date(startAt) >= new Date(endAt)) {
      alert("종료 일시는 시작 일시보다 이후여야 합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createRecruitment({
        title,
        description,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        quarterId: parseInt(quarterId),
        formId: parseInt(formId),
        active,
      });
      router.push("/manage/recruitment");
    } catch (error) {
      console.error("Failed to create recruitment:", error);
      alert("모집 생성에 실패했습니다.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">모집 생성</h1>
        <p className="text-muted-foreground mt-2">
          모집 기간과 사용할 폼을 선택하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Recruitment Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>모집 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    모집 제목 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="모집 제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    placeholder="모집에 대한 설명을 입력하세요"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Quarter */}
                <div className="space-y-2">
                  <Label htmlFor="quarter">
                    분기 선택 <span className="text-destructive">*</span>
                  </Label>
                  {quartersLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={quarterId} onValueChange={setQuarterId}>
                      <SelectTrigger id="quarter">
                        <SelectValue placeholder="분기를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {quarters.map((quarter) => (
                          <SelectItem
                            key={quarter.id}
                            value={quarter.id.toString()}
                          >
                            {quarter.year}년 {quarter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Separator />

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startAt">
                    모집 시작 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endAt">
                    모집 종료 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    required
                  />
                </div>

                <Separator />

                {/* Form Selection */}
                <div className="space-y-2">
                  <Label htmlFor="form">
                    사용 폼 선택 <span className="text-destructive">*</span>
                  </Label>
                  {formsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={formId} onValueChange={handleFormSelect}>
                      <SelectTrigger id="form">
                        <SelectValue placeholder="폼을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {forms.map((form) => (
                          <SelectItem key={form.id} value={form.id.toString()}>
                            {form.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    선택한 폼의 질문 목록이 오른쪽에 표시됩니다.
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="active"
                    checked={active}
                    onCheckedChange={setActive}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    활성화
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/manage/recruitment")}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? "생성 중..." : "모집 생성"}
              </Button>
            </div>
          </div>

          {/* Right: Form Preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>폼 미리보기</CardTitle>
              </CardHeader>
              <CardContent>
                {!formId ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">
                      왼쪽에서 폼을 선택하면 질문 목록이 표시됩니다.
                    </p>
                  </div>
                ) : formLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : selectedForm && formSchema ? (
                  <div className="space-y-4">
                    {/* Form Title */}
                    <div className="pb-3 border-b">
                      <h3 className="font-semibold text-lg">
                        {selectedForm.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formSchema.questions.length}개 질문
                      </p>
                    </div>

                    {/* Questions List */}
                    {formSchema.questions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">질문이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formSchema.questions.map((question, index) => (
                          <div
                            key={question.id}
                            className="border rounded-lg p-3 bg-muted/30"
                          >
                            <div className="flex items-start gap-2">
                              <Badge
                                variant="secondary"
                                className="shrink-0 text-xs"
                              >
                                Q{index + 1}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm break-words">
                                  {question.title || "(제목 없음)"}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {QUESTION_TYPE_LABELS[question.type]}
                                  </Badge>
                                  {question.required && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      필수
                                    </Badge>
                                  )}
                                </div>
                                {question.options &&
                                  question.options.length > 0 && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      <span className="font-medium">
                                        선택지:
                                      </span>{" "}
                                      {question.options.join(", ")}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-destructive">
                    <p className="text-sm">폼을 불러오는데 실패했습니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
