"use client";

import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { QuestionCard } from "./question-card";
import { FormPreview } from "./form-preview";
import { AdvancedJsonSection } from "./advanced-json-section";
import {
  FormSchema,
  Question,
  createEmptyQuestion,
  parseSchema,
  serializeSchema,
  generateQuestionId,
} from "@/lib/interfaces/form-builder";

interface FormBuilderProps {
  initialSchema: string;
  onChange: (schemaString: string) => void;
}

export function FormBuilder({ initialSchema, onChange }: FormBuilderProps) {
  const [schema, setSchema] = useState<FormSchema>(() =>
    parseSchema(initialSchema),
  );
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Sync schema changes to parent
  useEffect(() => {
    const serialized = serializeSchema(schema);
    onChange(serialized);
  }, [schema, onChange]);

  function handleAddQuestion() {
    setSchema((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion()],
    }));
  }

  function handleUpdateQuestion(index: number, updates: Partial<Question>) {
    setSchema((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === index ? { ...q, ...updates } : q,
      ),
    }));
  }

  function handleDuplicateQuestion(index: number) {
    const questionToDuplicate = schema.questions[index];
    const duplicated: Question = {
      ...questionToDuplicate,
      id: generateQuestionId(),
      title: `${questionToDuplicate.title} (복사본)`,
    };
    setSchema((prev) => ({
      ...prev,
      questions: [
        ...prev.questions.slice(0, index + 1),
        duplicated,
        ...prev.questions.slice(index + 1),
      ],
    }));
  }

  function handleDeleteQuestion(index: number) {
    setSchema((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index),
    }));
  }

  function handleMoveQuestion(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schema.questions.length) return;

    setSchema((prev) => {
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[targetIndex]] = [
        newQuestions[targetIndex],
        newQuestions[index],
      ];
      return { ...prev, questions: newQuestions };
    });
  }

  function handleJsonChange(newJson: string) {
    try {
      const parsed = parseSchema(newJson);
      setSchema(parsed);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs: Edit / Preview */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="edit">편집</TabsTrigger>
          <TabsTrigger value="preview">미리보기</TabsTrigger>
        </TabsList>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-6 mt-6">
          {/* Question Cards */}
          <div className="space-y-4">
            {schema.questions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p className="text-sm">
                  아직 질문이 없어요. 아래 버튼으로 질문을 추가해보세요.
                </p>
              </div>
            )}

            {schema.questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onUpdate={(updates) => handleUpdateQuestion(index, updates)}
                onDuplicate={() => handleDuplicateQuestion(index)}
                onDelete={() => handleDeleteQuestion(index)}
                onMoveUp={() => handleMoveQuestion(index, "up")}
                onMoveDown={() => handleMoveQuestion(index, "down")}
                canMoveUp={index > 0}
                canMoveDown={index < schema.questions.length - 1}
              />
            ))}

            {/* Add Question Button - at the end */}
            <Button
              type="button"
              onClick={handleAddQuestion}
              variant="outline"
              className="w-full border-dashed border-2 h-12"
            >
              <Plus className="mr-2 h-4 w-4" />
              질문 추가
            </Button>
          </div>

          <Separator />

          {/* Advanced JSON Section */}
          <AdvancedJsonSection
            jsonString={serializeSchema(schema)}
            onJsonChange={handleJsonChange}
          />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <FormPreview schema={schema} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
