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

export function parseSchema(schemaString: string): FormSchema {
  try {
    const parsed = JSON.parse(schemaString);
    // Validate structure
    if (!parsed.version || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid schema structure");
    }
    return parsed;
  } catch (error: any) {
    // Return empty schema if parsing fails
    return {
      version: 1,
      questions: [],
    };
  }
}

export function serializeSchema(schema: FormSchema): string {
  return JSON.stringify(schema, null, 2);
}
