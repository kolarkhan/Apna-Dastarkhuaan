import { apiClient } from "@/services/api/client";
import type { NotificationPreferences, User } from "@/types/api";

export const usersApi = {
  me: () => apiClient.get<User>("/users/me").then((r) => r.data),
  updateProfile: (payload: { name?: string; phone?: string; avatar?: string }) =>
    apiClient.patch<User>("/users/me", payload).then((r) => r.data),
  uploadAvatar: (formData: FormData) =>
    apiClient
      .post<{ avatar: string }>("/users/me/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data),
  changePassword: (payload: { current_password: string; new_password: string }) =>
    apiClient.post<{ message: string }>("/users/me/change-password", payload).then((r) => r.data),
  updateNotificationPreferences: (payload: NotificationPreferences) =>
    apiClient.patch<User>("/users/me/notification-preferences", payload).then((r) => r.data),
  deleteAccount: (password: string) =>
    apiClient.delete<{ message: string }>("/users/me", { data: { password } }).then((r) => r.data),
};
