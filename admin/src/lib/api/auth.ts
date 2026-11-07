import { apiClient } from "@/lib/api";
import type { AuthResponse } from "@/types/api";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),
};
