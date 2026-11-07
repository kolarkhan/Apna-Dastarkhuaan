import { apiClient } from "@/services/api/client";
import type { AuthResponse, User } from "@/types/api";

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "customer" | "kitchen_owner";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>("/auth/register", payload).then((r) => r.data),
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>("/auth/login", payload).then((r) => r.data),
  me: () => apiClient.get<User>("/auth/me").then((r) => r.data),
  forgotPassword: (email: string) =>
    apiClient.post<{ message: string; dev_reset_token?: string }>("/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (token: string, new_password: string) =>
    apiClient.post<{ message: string }>("/auth/reset-password", { token, new_password }).then((r) => r.data),
};
