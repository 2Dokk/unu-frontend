import { LoginRequest, LoginResponse } from "../interfaces/auth";
import axiosInstance from "./axiosInstance";

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>("/auth/login", data);
  return response.data;
}
