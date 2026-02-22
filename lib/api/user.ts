import { UserResponseDto } from "../interfaces/auth";
import { UserRoleUpdateRequestDto } from "../interfaces/role";
import axiosInstance from "./axiosInstance";
import axios from "axios";

// Public API instance (no auth required)
const publicAxios = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/public",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== Public APIs (no authentication required) =====

export async function getPublicUserByStudentId(
  studentId: string,
): Promise<UserResponseDto> {
  const response = await publicAxios.get<UserResponseDto>(
    `/users/studentId/${studentId}`,
  );
  return response.data;
}

export async function searchPublicUsers(params: {
  name?: string;
  studentId?: string;
}): Promise<UserResponseDto[]> {
  const queryParams = new URLSearchParams();
  if (params.name) queryParams.append("name", params.name);
  if (params.studentId) queryParams.append("student-id", params.studentId);

  const response = await publicAxios.get<UserResponseDto[]>(
    `/users/search?${queryParams.toString()}`,
  );
  return response.data;
}

// ===== Authenticated APIs =====

export async function getAllUsers(): Promise<UserResponseDto[]> {
  const response = await axiosInstance.get<UserResponseDto[]>("/users");
  return response.data;
}

export async function getUserById(userId: string): Promise<UserResponseDto> {
  const response = await axiosInstance.get<UserResponseDto>(`/users/${userId}`);
  return response.data;
}

export async function getUserByStudentId(
  studentId: string,
): Promise<UserResponseDto> {
  const response = await axiosInstance.get<UserResponseDto>(
    `/users/studentId/${studentId}`,
  );
  return response.data;
}

export async function changeUserRole(
  data: UserRoleUpdateRequestDto,
): Promise<UserResponseDto> {
  const response = await axiosInstance.put<UserResponseDto>(
    "/admin/users/role",
    data,
  );
  return response.data;
}

export async function searchUsers(params: {
  role?: string;
  isActive?: boolean;
  joinedQuarter?: string;
  name?: string;
  studentId?: string;
}): Promise<UserResponseDto[]> {
  const queryParams = new URLSearchParams();
  if (params.role) queryParams.append("role", params.role);
  if (params.isActive !== undefined)
    queryParams.append("is-active", params.isActive.toString());
  if (params.joinedQuarter)
    queryParams.append("joined-quarter", params.joinedQuarter);
  if (params.name) queryParams.append("name", params.name);
  if (params.studentId) queryParams.append("student-id", params.studentId);

  const response = await axiosInstance.get<UserResponseDto[]>(
    `/users/search?${queryParams.toString()}`,
  );
  return response.data;
}
