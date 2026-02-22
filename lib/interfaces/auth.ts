import { QuarterResponse } from "./quarter";
import { UserRoleResponse } from "./role";

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
  isActive: boolean;
  joinedQuarter: QuarterResponse;
  userRoles: UserRoleResponse[];
}

export interface UserInfoResponseDto {
  username: string;
  email: string;
  name: string;
  studentId: string;
  phoneNumber: string;
  githubId: string;
  isActive: boolean;
  joinedQuarter: QuarterResponse;
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
