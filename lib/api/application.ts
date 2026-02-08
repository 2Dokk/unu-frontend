import {
  ApplicationRequest,
  ApplicationResponse,
  PasswordRequest,
  ApplicationReviewRequest,
  ApplicationSearchQuery,
} from "../interfaces/application";
import axiosInstance from "./axiosInstance";

// Public endpoints
export async function createApplication(
  data: ApplicationRequest,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.post<ApplicationResponse>(
    "/public/applications",
    data,
  );
  return response.data;
}

export async function updateApplication(
  id: number,
  data: ApplicationRequest,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.put<ApplicationResponse>(
    `/applications/${id}`,
    data,
  );
  return response.data;
}

export async function deleteApplication(
  id: number,
  password: string,
): Promise<void> {
  await axiosInstance.delete(`/applications/${id}`, {
    data: { password },
  });
}

export async function getApplicationByIdWithPassword(
  id: number,
  password: string,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.get<ApplicationResponse>(
    `/applications/${id}`,
    {
      params: { password },
    },
  );
  return response.data;
}

// Admin endpoints
export async function getApplicationById(
  id: number,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.get<ApplicationResponse>(
    `/admin/applications/${id}`,
  );
  return response.data;
}

export async function getApplicationsByRecruitmentId(
  recruitmentId: number,
): Promise<ApplicationResponse[]> {
  const response = await axiosInstance.get<ApplicationResponse[]>(
    `/admin/recruitments/${recruitmentId}/applications`,
  );
  return response.data;
}

export async function reviewApplication(
  id: number,
  status: string,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.patch<ApplicationResponse>(
    `/admin/applications/${id}/review`,
    { status },
  );
  return response.data;
}

export async function cancelApplication(id: number): Promise<void> {
  await axiosInstance.post(`/admin/applications/${id}/cancel`);
}

// Public self-service endpoints
export async function searchApplication(
  query: ApplicationSearchQuery,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.post<ApplicationResponse>(
    "/public/applications/search",
    query,
  );
  return response.data;
}

export async function verifyApplication(
  applicationId: number,
  password: string,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.post<ApplicationResponse>(
    `/public/applications/${applicationId}/verify`,
    { password },
  );
  return response.data;
}

export async function updatePublicApplication(
  applicationId: number,
  applicationData: ApplicationRequest,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.put<ApplicationResponse>(
    `/public/applications/${applicationId}`,
    applicationData,
  );
  return response.data;
}

export async function cancelPublicApplication(
  applicationId: number,
  password: string,
): Promise<void> {
  await axiosInstance.post(`/public/applications/${applicationId}/cancel`, {
    password,
  });
}
