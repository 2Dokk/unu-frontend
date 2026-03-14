import axiosInstance from "./axiosInstance";
import {
  FormSubmissionRequestDto,
  FormSubmissionResponseDto,
} from "../interfaces/form-submission";

export async function getFormSubmissionById(
  id: string,
): Promise<FormSubmissionResponseDto> {
  const response = await axiosInstance.get<FormSubmissionResponseDto>(
    `/form-submissions/${id}`,
  );
  return response.data;
}

export async function getFormSubmissionsByFormId(
  formId: string,
): Promise<FormSubmissionResponseDto[]> {
  const response = await axiosInstance.get<FormSubmissionResponseDto[]>(
    `/forms/${formId}/submissions`,
  );
  return response.data;
}

export async function getFormSubmissionsByUserId(
  userId: string,
): Promise<FormSubmissionResponseDto[]> {
  const response = await axiosInstance.get<FormSubmissionResponseDto[]>(
    `/form-submissions`,
    { params: { userId } },
  );
  return response.data;
}

export async function createFormSubmission(
  data: FormSubmissionRequestDto,
): Promise<FormSubmissionResponseDto> {
  const response = await axiosInstance.post<FormSubmissionResponseDto>(
    `/form-submissions`,
    data,
  );
  return response.data;
}

export async function deleteFormSubmission(id: string): Promise<void> {
  await axiosInstance.delete(`/form-submissions/${id}`);
}
