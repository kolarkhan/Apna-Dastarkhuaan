import { apiClient } from "@/services/api/client";
import type { CustomizationOption, FoodItem, PagedResponse, SpiceLevel } from "@/types/api";

export interface ListFoodsParams {
  kitchen_id?: string;
  category_id?: string;
  search?: string;
  available?: boolean;
  min_price?: number;
  max_price?: number;
  spice_level?: SpiceLevel;
  sort?: "popular" | "price_asc" | "price_desc" | "rating";
  page?: number;
  page_size?: number;
}

export interface CreateFoodPayload {
  name: string;
  description: string;
  price: number;
  category_id: string;
  ingredients: string[];
  portion: string;
  preparation_time_minutes: number;
  spice_level: SpiceLevel;
  customization_options: CustomizationOption[];
  available: boolean;
}

export const foodsApi = {
  list: (params: ListFoodsParams) => apiClient.get<PagedResponse<FoodItem>>("/foods", { params }).then((r) => r.data),
  getById: (id: string) => apiClient.get<FoodItem>(`/foods/${id}`).then((r) => r.data),
  create: (payload: CreateFoodPayload) => apiClient.post<FoodItem>("/foods", payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreateFoodPayload>) =>
    apiClient.put<FoodItem>(`/foods/${id}`, payload).then((r) => r.data),
  setAvailability: (id: string, available: boolean) =>
    apiClient.patch<{ available: boolean }>(`/foods/${id}/availability`, null, { params: { available } }).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/foods/${id}`),
  uploadImage: (id: string, formData: FormData) =>
    apiClient
      .post<{ image: string }>(`/foods/${id}/images`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data),
};
