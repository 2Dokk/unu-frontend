import { AuditorDto } from "./auth";
import { FormResponse } from "./form";
import { QuarterResponse } from "./quarter";

export interface RecruitmentRequest {
  title: string;
  description: string;
  completionMessage?: string;
  startAt: string;
  endAt: string;
  quarterId: string;
  formId: string;
  active: boolean;
}

export interface RecruitmentResponse {
  id: string;
  title: string;
  description: string;
  completionMessage: string | null;
  startAt: string;
  endAt: string;
  quarter: QuarterResponse;
  active: boolean;
  form: FormResponse;
  createdAt: string;
  modifiedAt: string;
  createdBy: AuditorDto;
  modifiedBy: AuditorDto;
}

export interface RecruitmentCompletionMessageResponse {
  completionMessage: string | null;
}
