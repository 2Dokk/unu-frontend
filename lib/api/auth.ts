import {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  SignUpRequestDto,
  SignUpResponseDto,
  SignupTokenResponseDto,
  UpdateProfileRequest,
  UserInfoResponseDto,
  UserResponseDto,
} from "../interfaces/auth";
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
  const response = await axiosInstance.post<SignUpResponseDto>(
    "/auth/signup",
    data,
    { params: { token } },
  );
  return response.data;
}

export async function generateSignupToken(): Promise<SignupTokenResponseDto> {
  const response = await axiosInstance.post<SignupTokenResponseDto>(
    "/admin/auth/token",
  );
  return response.data;
}
