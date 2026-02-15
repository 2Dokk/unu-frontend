import { FormRequest, FormResponse } from "../interfaces/form";
import axiosInstance from "./axiosInstance";

export async function getAllForms(): Promise<FormResponse[]> {
  const response = await axiosInstance.get<FormResponse[]>("/forms");
  return response.data;
}

export async function createForm(data: FormRequest): Promise<FormResponse> {
  const response = await axiosInstance.post<FormResponse>("/forms", data);
  return response.data;
}

export async function getFormById(id: number): Promise<FormResponse> {
  const response = await axiosInstance.get<FormResponse>(`/forms/${id}`);
  return response.data;
}

export async function updateForm(
  id: number,
  data: FormRequest,
): Promise<FormResponse> {
  const response = await axiosInstance.put<FormResponse>(`/forms/${id}`, data);
  return response.data;
}

export async function deleteForm(id: number): Promise<void> {
  await axiosInstance.delete(`/forms/${id}`);
}
