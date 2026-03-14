import { AuditorDto } from "./auth";

export interface FormSubmissionResponseDto {
  id: string;
  formId: string;
  userId: string;
  answers: Record<string, any>;
  formSnapshot: string;
  submittedAt: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: AuditorDto;
  modifiedBy: AuditorDto;
}

export interface FormSubmissionRequestDto {
  formId: string;
  answers: Record<string, any>;
}
