import { apiClient } from "@/services/api/client";
import type { ChatMessage } from "@/types/api";

export const chatApi = {
  list: (orderId: string) => apiClient.get<ChatMessage[]>(`/orders/${orderId}/messages`).then((r) => r.data),
  send: (orderId: string, text: string) =>
    apiClient.post<ChatMessage>(`/orders/${orderId}/messages`, { text }).then((r) => r.data),
};
