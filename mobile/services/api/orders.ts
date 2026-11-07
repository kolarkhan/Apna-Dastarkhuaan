import { apiClient } from "@/services/api/client";
import type { Order, OrderStatus, PagedResponse, PaymentMethod } from "@/types/api";

export interface CreateOrderPayload {
  food_id: string;
  quantity: number;
  customizations: string[];
  special_instructions?: string;
  address_id: string;
  payment_method: PaymentMethod;
  notes?: string;
  scheduled_for?: string;
}

export const ordersApi = {
  list: (params: { status_filter?: OrderStatus; page?: number; page_size?: number } = {}) =>
    apiClient.get<PagedResponse<Order>>("/orders", { params }).then((r) => r.data),
  active: () => apiClient.get<Order | null>("/orders/active").then((r) => r.data),
  getById: (id: string) => apiClient.get<Order>(`/orders/${id}`).then((r) => r.data),
  create: (payload: CreateOrderPayload) => apiClient.post<Order>("/orders", payload).then((r) => r.data),
  updateStatus: (id: string, status: OrderStatus, reason?: string) =>
    apiClient.patch<Order>(`/orders/${id}/status`, { status, reason }).then((r) => r.data),
  cancel: (id: string, reason?: string) => apiClient.post<Order>(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
};
