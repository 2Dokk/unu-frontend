export interface FormRequest {
  templateId?: string;
  title: string;
  schema: string;
}

export interface FormResponse {
  id: string;
  template?: FormTemplateResponse;
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
  id: string;
  title: string;
  schema: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string;
}
