import { apiClient } from "@/lib/api";
import type {
  DashboardStats,
  FoodItem,
  Kitchen,
  Order,
  OrderStatus,
  PagedResponse,
  Payment,
  Review,
  User,
} from "@/types/api";

export const adminApi = {
  stats: () => apiClient.get<DashboardStats>("/admin/stats").then((r) => r.data),

  customers: (params: { page?: number; page_size?: number; search?: string } = {}) =>
    apiClient.get<PagedResponse<User>>("/admin/customers", { params }).then((r) => r.data),
  suspendUser: (id: string, reason?: string) => apiClient.patch(`/admin/users/${id}/suspend`, { reason }),
  unsuspendUser: (id: string) => apiClient.patch(`/admin/users/${id}/unsuspend`),

  kitchens: (params: { page?: number; page_size?: number; status_filter?: string } = {}) =>
    apiClient.get<PagedResponse<Kitchen>>("/admin/kitchens", { params }).then((r) => r.data),
  approveKitchen: (id: string) => apiClient.patch<Kitchen>(`/admin/kitchens/${id}/approve`).then((r) => r.data),
  rejectKitchen: (id: string, reason: string) =>
    apiClient.patch<Kitchen>(`/admin/kitchens/${id}/reject`, { reason }).then((r) => r.data),
  verifyKitchen: (id: string) => apiClient.patch<Kitchen>(`/admin/kitchens/${id}/verify`).then((r) => r.data),
  suspendKitchen: (id: string, reason?: string) =>
    apiClient.patch<Kitchen>(`/admin/kitchens/${id}/suspend`, { reason }).then((r) => r.data),
  unsuspendKitchen: (id: string) => apiClient.patch<Kitchen>(`/admin/kitchens/${id}/unsuspend`).then((r) => r.data),

  foods: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PagedResponse<FoodItem>>("/admin/foods", { params }).then((r) => r.data),
  removeFood: (id: string) => apiClient.delete(`/admin/foods/${id}`),

  orders: (params: { page?: number; page_size?: number; status_filter?: OrderStatus } = {}) =>
    apiClient.get<PagedResponse<Order>>("/admin/orders", { params }).then((r) => r.data),

  reviews: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PagedResponse<Review>>("/admin/reviews", { params }).then((r) => r.data),
  removeReview: (id: string) => apiClient.delete(`/admin/reviews/${id}`),

  payments: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PagedResponse<Payment>>("/admin/payments", { params }).then((r) => r.data),

  broadcastNotification: (payload: { title: string; body: string; audience: "all" | "customers" | "kitchen_owners" }) =>
    apiClient.post<{ message: string }>("/admin/notifications/broadcast", payload).then((r) => r.data),
};
