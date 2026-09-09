import { QuarterResponse } from "./quarter";
import { UserRoleResponse } from "./role";

export interface AuditorDto {
  id: string;
  name: string;
  username: string;
  studentId: string;
  githubId?: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
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

export interface UserSummaryDto {
  id: string;
  name: string;
  studentId: string;
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
  major: string;
  subMajor: string;
  githubId: string;
  phoneNumber: string;
  email: string;
}

export interface SignUpResponseDto {
  id: string;
  username: string;
  email: string;
  name: string;
}

export interface SignupInvitationMember {
  id: string;
  studentId: string;
  userId: string | null;
  userName: string | null;
  usedAt: string | null;
}

export interface SignupInvitation {
  id: string;
  name: string;
  joinedQuarterId: string;
  joinedQuarterName: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  totalCount: number;
  usedCount: number;
  token: string;
  members: SignupInvitationMember[];
}

export interface SignupInvitationCreateRequest {
  name: string;
  joinedQuarterId: string;
  expiresAt: string;
  studentIds: string[];
}

export interface SignupEligibility {
  invitationName: string;
  studentId: string;
  joinedQuarterId: string;
  joinedQuarterName: string;
  name: string | null;
  major: string | null;
  subMajor: string | null;
  email: string | null;
  githubId: string | null;
  phoneNumber: string | null;
}
