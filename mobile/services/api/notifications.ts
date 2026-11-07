import { apiClient } from "@/services/api/client";
import type { AppNotification, PagedResponse } from "@/types/api";

export const notificationsApi = {
  list: (params: { unread_only?: boolean; page?: number; page_size?: number } = {}) =>
    apiClient.get<PagedResponse<AppNotification>>("/notifications", { params }).then((r) => r.data),
  unreadCount: () => apiClient.get<{ count: number }>("/notifications/unread-count").then((r) => r.data),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch("/notifications/read-all"),
  remove: (id: string) => apiClient.delete(`/notifications/${id}`),
};
