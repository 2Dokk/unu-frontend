import {
  ApplicationRequest,
  ApplicationResponse,
  ApplicationSearchQuery,
} from "../interfaces/application";
import axiosInstance from "./axiosInstance";

// ===== Public Application Endpoints =====
// 공개 API - 인증 없이 접근 가능

/**
 * 새로운 지원서 생성
 * POST /api/public/applications
 */
export async function createApplication(
  data: ApplicationRequest,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.post<ApplicationResponse>(
    "/public/applications",
    data,
  );
  return response.data;
}

/**
 * 지원서 조회 (이메일/전화번호 + 비밀번호로 조회)
 * POST /api/public/applications/lookup
 */
export async function lookupApplication(
  query: ApplicationSearchQuery,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.post<ApplicationResponse>(
    "/public/applications/lookup",
    query,
  );
  return response.data;
}

/**
 * 지원서 수정 (비밀번호 인증 후)
 * PUT /api/public/applications/{id}
 */
export async function updateApplication(
  id: number,
  data: ApplicationRequest,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.put<ApplicationResponse>(
    `/public/applications/${id}`,
    data,
  );
  return response.data;
}

/**
 * 지원서 취소 (비밀번호 인증)
 * PATCH /api/public/applications/{id}/cancel
 */
export async function cancelApplicationWithPassword(
  id: number,
  password: string,
): Promise<void> {
  await axiosInstance.patch(`/public/applications/${id}/cancel`, {
    password,
  });
}

/**
 * 지원서 상세 조회 (비밀번호 인증)
 * POST /api/public/applications/{id}/verify
 */
export async function verifyApplication(
  id: number,
  password: string,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.post<ApplicationResponse>(
    `/public/applications/${id}/verify`,
    { password },
  );
  return response.data;
}

// ===== Admin/Manager Application Endpoints =====
// 관리자 전용 API - MANAGER/ADMIN 권한 필요

/**
 * 특정 지원서 조회 (관리자)
 * GET /api/applications/{id}
 */
export async function getApplicationById(
  id: number,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.get<ApplicationResponse>(
    `/applications/${id}`,
  );
  return response.data;
}

/**
 * 모집 공고별 지원서 목록 조회
 * GET /api/applications/{recruitmentId}/applications
 */
export async function getApplicationsByRecruitmentId(
  recruitmentId: number,
): Promise<ApplicationResponse[]> {
  const response = await axiosInstance.get<ApplicationResponse[]>(
    `/applications/${recruitmentId}/applications`,
  );
  return response.data;
}

/**
 * 지원서 상태 업데이트 (심사)
 * PATCH /api/applications/{id}/review
 */
export async function reviewApplication(
  id: number,
  status: string,
): Promise<ApplicationResponse> {
  const response = await axiosInstance.patch<ApplicationResponse>(
    `/applications/${id}/review`,
    { status },
  );
  return response.data;
}

/**
 * 지원서 취소 (관리자)
 * POST /api/applications/{id}/cancel
 */
export async function cancelApplication(id: number): Promise<void> {
  await axiosInstance.post(`/applications/${id}/cancel`);
}

/**
 * 지원서 삭제 (관리자)
 * DELETE /api/applications/{id}
 */
export async function deleteApplication(id: number): Promise<void> {
  await axiosInstance.delete(`/applications/${id}`);
}
