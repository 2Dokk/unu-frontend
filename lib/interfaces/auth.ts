import { QuarterResponse } from "./quarter";
import { UserRoleResponse } from "./role";

export interface AuditorDto {
  id: string;
  name: string;
  username: string;
  studentId: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  email: string;
  nickname: string | null;
}

export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  name: string;
  studentId: string;
  phoneNumber: string;
  githubId: string;
  major: string;
  subMajor?: string;
  isCurrentQuarterActive: boolean;
  joinedQuarter?: QuarterResponse;
  userRoles: UserRoleResponse[];
}

export interface UserInfoResponseDto {
  username: string;
  email: string;
  name: string;
  studentId: string;
  phoneNumber: string;
  githubId: string;
  isCurrentQuarterActive: boolean;
  joinedQuarter?: QuarterResponse;
}

export interface UpdateProfileRequest {
  name: string;
  username: string;
  studentId: string;
  email: string;
  phoneNumber: string;
  githubId: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SignUpRequestDto {
  name: string;
  username: string;
  password: string;
  studentId: string;
  githubId: string;
  phoneNumber: string;
  email: string;
  joinedQuarterId: string;
}

export interface SignUpResponseDto {
  id: string;
  username: string;
  email: string;
  name: string;
}

export interface SignupTokenResponseDto {
  token: string;
  expiresAt: string;
}
