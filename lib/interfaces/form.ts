export interface FormRequest {
  templateId: number;
  title: string;
  schema: string;
}

export interface FormResponse {
  id: number;
  template: FormTemplateResponse;
  title: string;
  schema: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface FormTemplateRequest {
  title: string;
  schema: string;
}

export interface FormTemplateResponse {
  id: number;
  title: string;
  schema: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string;
}
