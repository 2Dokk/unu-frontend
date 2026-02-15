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
  id: number;
  username: string;
  email: string;
  name: string;
  studentId: string;
  isActive: boolean;
  joinedQuarter: QuarterResponse;
  userRoles: UserRoleResponse[];
}
