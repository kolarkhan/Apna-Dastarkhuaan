import { apiClient } from "@/services/api/client";
import type { PagedResponse, Review } from "@/types/api";

export interface CreateReviewPayload {
  order_id: string;
  food_id?: string;
  food_rating: number;
  kitchen_rating: number;
  delivery_rating: number;
  comment?: string;
}

export const reviewsApi = {
  list: (params: { kitchen_id?: string; food_id?: string; page?: number; page_size?: number } = {}) =>
    apiClient.get<PagedResponse<Review>>("/reviews", { params }).then((r) => r.data),
  mine: () => apiClient.get<Review[]>("/reviews/mine").then((r) => r.data),
  create: (payload: CreateReviewPayload) => apiClient.post<Review>("/reviews", payload).then((r) => r.data),
};
