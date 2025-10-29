import { LoginRequest } from "../interfaces/auth";
import axiosInstance from "./axiosInstance";

export function login(data: LoginRequest) {
  return axiosInstance.post("/auth/login", data);
}
