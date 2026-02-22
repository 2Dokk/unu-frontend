import { FormResponse } from "./form";
import { QuarterResponse } from "./quarter";

export interface RecruitmentRequest {
  title: string;
  description: string;
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
  startAt: string;
  endAt: string;
  quarter: QuarterResponse;
  active: boolean;
  form: FormResponse;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string;
}
