export type QuestionType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: string[];
}

export interface FormSchema {
  version: number;
  questions: Question[];
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SHORT_TEXT: "단답형",
  LONG_TEXT: "장문형",
  SINGLE_CHOICE: "객관식 (단일 선택)",
  MULTIPLE_CHOICE: "객관식 (다중 선택)",
};

export function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyQuestion(): Question {
  return {
    id: generateQuestionId(),
    type: "SHORT_TEXT",
    title: "",
    required: false,
  };
}

export function parseSchema(schemaValue: unknown): FormSchema {
  try {
    const parsed =
      typeof schemaValue === "string" ? JSON.parse(schemaValue) : schemaValue;
    // Validate structure
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("version" in parsed) ||
      !("questions" in parsed) ||
      !Array.isArray(parsed.questions)
    ) {
      throw new Error("Invalid schema structure");
    }
    return parsed;
  } catch {
    // Return empty schema if parsing fails
    return {
      version: 1,
      questions: [],
    };
  }
}

export function validateRequiredAnswers(
  schema: FormSchema,
  answers: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  schema.questions.forEach((question) => {
    if (!question.required) return;
    const answer = answers[question.id];
    if (
      answer === undefined ||
      answer === null ||
      (typeof answer === "string" && answer.trim() === "") ||
      (Array.isArray(answer) && answer.length === 0)
    ) {
      errors[`q_${question.id}`] = "필수 질문입니다.";
    }
  });

  return errors;
}

export function serializeSchema(schema: FormSchema): string {
  return JSON.stringify(schema, null, 2);
}
