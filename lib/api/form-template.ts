import { FormTemplateRequest, FormTemplateResponse } from "../interfaces/form";
import axiosInstance from "./axiosInstance";

export async function getAllFormTemplates(): Promise<FormTemplateResponse[]> {
  const response =
    await axiosInstance.get<FormTemplateResponse[]>("/form-templates");
  return response.data;
}

export async function createFormTemplate(
  data: FormTemplateRequest,
): Promise<FormTemplateResponse> {
  const response = await axiosInstance.post<FormTemplateResponse>(
    "/form-templates",
    data,
  );
  return response.data;
}

export async function getFormTemplateById(
  id: number,
): Promise<FormTemplateResponse> {
  const response = await axiosInstance.get<FormTemplateResponse>(
    `/form-templates/${id}`,
  );
  return response.data;
}

export async function updateFormTemplate(
  id: number,
  data: FormTemplateRequest,
): Promise<FormTemplateResponse> {
  const response = await axiosInstance.put<FormTemplateResponse>(
    `/form-templates/${id}`,
    data,
  );
  return response.data;
}

export async function deleteFormTemplate(id: number): Promise<void> {
  await axiosInstance.delete(`/form-templates/${id}`);
}
