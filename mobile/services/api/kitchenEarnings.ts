import { apiClient } from "@/services/api/client";
import type { KitchenEarningsSummary, PagedResponse } from "@/types/api";

export const kitchenEarningsApi = {
  summary: () => apiClient.get<KitchenEarningsSummary>("/kitchen-earnings/summary").then((r) => r.data),
  history: (params: { page?: number; page_size?: number } = {}) =>
    apiClient
      .get<PagedResponse<{ order_id: string; order_number: string; amount: number; created_at: string }>>(
        "/kitchen-earnings/history",
        { params }
      )
      .then((r) => r.data),
};
