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
  name?: string;
  studentId?: string;
  role?: string;
  isActive?: boolean;
  joinedQuarter?: string;
}
