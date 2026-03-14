"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { getFormById } from "@/lib/api/form";
import { createFormSubmission } from "@/lib/api/form-submission";
import { FormResponse } from "@/lib/interfaces/form";
import { parseSchema, Question } from "@/lib/interfaces/form-builder";

type Answers = Record<string, string | string[]>;

function QuestionField({
  question,
  index,
  value,
  onChange,
  error,
}: {
  question: Question;
  index: number;
  value: string | string[] | undefined;
  onChange: (val: string | string[]) => void;
  error: boolean;
}) {
  return (
    <Card className={error ? "border-destructive" : ""}>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start gap-2">
          <span className="flex-1 text-sm font-medium whitespace-pre-wrap">
            {index + 1}. {question.title || "(제목 없음)"}
          </span>
          {question.required && (
            <Badge variant="destructive" className="shrink-0 text-xs">
              필수
            </Badge>
          )}
        </div>

        {question.type === "SHORT_TEXT" && (
          <Input
            placeholder="답변을 입력하세요"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {question.type === "LONG_TEXT" && (
          <Textarea
            placeholder="답변을 입력하세요"
            className="min-h-28 resize-none"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {question.type === "SINGLE_CHOICE" && (
          <RadioGroup value={(value as string) ?? ""} onValueChange={onChange}>
            {(question.options ?? []).map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                <Label
                  htmlFor={`${question.id}-${idx}`}
                  className="font-normal"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === "MULTIPLE_CHOICE" && (
          <div className="space-y-2">
            {(question.options ?? []).map((option, idx) => {
              const checked = Array.isArray(value) && value.includes(option);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Checkbox
                    id={`${question.id}-${idx}`}
                    checked={checked}
                    onCheckedChange={(c) => {
                      const prev = Array.isArray(value) ? value : [];
                      onChange(
                        c
                          ? [...prev, option]
                          : prev.filter((v) => v !== option),
                      );
                    }}
                  />
                  <Label
                    htmlFor={`${question.id}-${idx}`}
                    className="font-normal"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="text-xs text-destructive">필수 항목입니다</p>}
      </CardContent>
    </Card>
  );
}

export default function FormSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getFormById(id)
      .then(setForm)
      .catch((error: any) => console.error("Failed to load form:", error))
      .finally(() => setLoading(false));
  }, [id]);

  function setAnswer(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  }

  function validate(schema: ReturnType<typeof parseSchema>): boolean {
    const newErrors = new Set<string>();
    schema.questions.forEach((q) => {
      if (!q.required) return;
      const val = answers[q.id];
      if (!val || (Array.isArray(val) && val.length === 0) || val === "") {
        newErrors.add(q.id);
      }
    });
    setErrors(newErrors);
    return newErrors.size === 0;
  }

  async function handleSubmit() {
    if (!form) return;
    const schema = parseSchema(form.schema);
    if (!validate(schema)) return;

    setSubmitting(true);
    try {
      await createFormSubmission({ formId: id, answers });
      setSubmitted(true);
    } catch (error: any) {
      console.error("Failed to submit form:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-7 w-1/2" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
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

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h1 className="text-xl font-bold">제출 완료</h1>
        <p className="text-sm text-muted-foreground">
          신청서가 성공적으로 제출되었습니다.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  const schema = parseSchema(form.schema);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{form.title}</h1>
        <p className="text-sm text-muted-foreground">
          모든 필수 항목을 작성해 주세요.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {schema.questions.map((q, i) => (
          <QuestionField
            key={q.id}
            question={q}
            index={i}
            value={answers[q.id]}
            onChange={(val) => setAnswer(q.id, val)}
            error={errors.has(q.id)}
          />
        ))}
      </div>

      {errors.size > 0 && (
        <p className="text-sm text-destructive">
          필수 항목을 모두 입력해 주세요.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/forms/${id}`)}
          disabled={submitting}
        >
          취소
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "제출 중..." : "제출하기"}
        </Button>
      </div>
    </div>
  );
}
