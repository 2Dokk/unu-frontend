import {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  SignUpRequestDto,
  SignUpResponseDto,
  SignupEligibility,
  SignupInvitation,
  SignupInvitationCreateRequest,
  UpdateProfileRequest,
  UserInfoResponseDto,
  UserResponseDto,
} from "../interfaces/auth";
import axios from "axios";
import axiosInstance from "./axiosInstance";

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>("/auth/login", data);
  return response.data;
}

// 서버가 HttpOnly refresh 쿠키를 만료시켜 삭제한다.
export async function logout(): Promise<void> {
  await axiosInstance.post("/auth/logout");
}

export async function getMe(): Promise<UserInfoResponseDto> {
  const response = await axiosInstance.get<UserInfoResponseDto>("/auth/me");
  return response.data;
}

export async function updateMe(
  data: UpdateProfileRequest,
): Promise<UserResponseDto> {
  const response = await axiosInstance.put<UserResponseDto>("/auth/me", data);
  return response.data;
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<void> {
  await axiosInstance.patch("/auth/me/password", data);
}

export async function signup(
  data: SignUpRequestDto,
  token: string,
): Promise<SignUpResponseDto> {
  try {
    const response = await axiosInstance.post<SignUpResponseDto>(
      "/auth/signup",
      data,
      { params: { token } },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
      throw new Error(error.response.data);
    }
    throw error;
  }
}

export async function verifySignupEligibility(
  token: string,
  studentId: string,
): Promise<SignupEligibility> {
  try {
    const response = await axiosInstance.post<SignupEligibility>(
      "/auth/signup/verify",
      { studentId },
      { params: { token } },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
      throw new Error(error.response.data);
    }
    throw error;
  }
}

export async function getSignupInvitations(): Promise<SignupInvitation[]> {
  const response = await axiosInstance.get<SignupInvitation[]>(
    "/admin/auth/invitations",
  );
  return response.data;
}

export async function getSignupInvitation(
  invitationId: string,
): Promise<SignupInvitation> {
  const response = await axiosInstance.get<SignupInvitation>(
    `/admin/auth/invitations/${invitationId}`,
  );
  return response.data;
}

export async function createSignupInvitation(
  data: SignupInvitationCreateRequest,
): Promise<SignupInvitation> {
  const response = await axiosInstance.post<SignupInvitation>(
    "/admin/auth/invitations",
    data,
  );
  return response.data;
}

export async function addSignupInvitationMembers(
  invitationId: string,
  studentIds: string[],
): Promise<SignupInvitation> {
  const response = await axiosInstance.post<SignupInvitation>(
    `/admin/auth/invitations/${invitationId}/members`,
    { studentIds },
  );
  return response.data;
}

export async function removeSignupInvitationMember(
  invitationId: string,
  memberId: string,
): Promise<void> {
  await axiosInstance.delete(
    `/admin/auth/invitations/${invitationId}/members/${memberId}`,
  );
}

export async function updateSignupInvitationExpiration(
  invitationId: string,
  expiresAt: string,
): Promise<SignupInvitation> {
  const response = await axiosInstance.patch<SignupInvitation>(
    `/admin/auth/invitations/${invitationId}/expiration`,
    { expiresAt },
  );
  return response.data;
}

export async function revokeSignupInvitation(
  invitationId: string,
): Promise<SignupInvitation> {
  const response = await axiosInstance.post<SignupInvitation>(
    `/admin/auth/invitations/${invitationId}/revoke`,
  );
  return response.data;
}

export function getAuthApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message;
  if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
    return error.response.data;
  }
  return fallback;
}
