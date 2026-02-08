import { FormResponse } from "./form";
import { QuarterResponse } from "./quarter";

export interface RecruitmentRequest {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  quarterId: number;
  formId: number;
  active: boolean;
}

export interface RecruitmentResponse {
  id: number;
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
