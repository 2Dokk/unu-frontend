"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { FormSchema } from "@/lib/interfaces/form-builder";

interface FormPreviewProps {
  schema: FormSchema;
}

export function FormPreview({ schema }: FormPreviewProps) {
  if (schema.questions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>질문이 없어요. 질문을 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {schema.questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">
                  {index + 1}. {question.title || "(제목 없음)"}
                </Label>
                {question.required && (
                  <Badge variant="destructive" className="text-xs">
                    필수
                  </Badge>
                )}
              </div>

              {/* Render input based on question type */}
              {question.type === "SHORT_TEXT" && (
                <Input placeholder="답변을 입력하세요" disabled />
              )}

              {question.type === "LONG_TEXT" && (
                <Textarea
                  placeholder="답변을 입력하세요"
                  className="min-h-32 resize-none"
                  disabled
                />
              )}

              {question.type === "SINGLE_CHOICE" && (
                <RadioGroup disabled>
                  {(question.options || []).map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={`${idx}`}
                        id={`${question.id}-${idx}`}
                      />
                      <Label
                        htmlFor={`${question.id}-${idx}`}
                        className="font-normal"
                      >
                        {option || `(선택지 ${idx + 1})`}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                  {(question.options || []).map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Checkbox id={`${question.id}-${idx}`} disabled />
                      <Label
                        htmlFor={`${question.id}-${idx}`}
                        className="font-normal"
                      >
                        {option || `(선택지 ${idx + 1})`}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
