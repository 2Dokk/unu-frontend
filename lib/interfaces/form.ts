import { AuditorDto } from "./auth";

export interface FormRequest {
  templateId?: string;
  title: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  schema: string;
}

export interface FormResponse {
  id: string;
  template?: FormTemplateResponse;
  title: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  schema: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: AuditorDto;
  modifiedBy: AuditorDto;
}

export interface FormTemplateRequest {
  title: string;
  description?: string;
  schema: string;
}

export interface FormTemplateResponse {
  id: string;
  title: string;
  description?: string;
  schema: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: AuditorDto;
  modifiedBy: AuditorDto;
}
