import { apiClient } from "@/services/api/client";
import type { FoodItem, Kitchen } from "@/types/api";

export const favoritesApi = {
  kitchens: () => apiClient.get<Kitchen[]>("/favorites/kitchens").then((r) => r.data),
  favoriteKitchen: (id: string) => apiClient.post(`/favorites/kitchens/${id}`),
  unfavoriteKitchen: (id: string) => apiClient.delete(`/favorites/kitchens/${id}`),
  foods: () => apiClient.get<FoodItem[]>("/favorites/foods").then((r) => r.data),
  favoriteFood: (id: string) => apiClient.post(`/favorites/foods/${id}`),
  unfavoriteFood: (id: string) => apiClient.delete(`/favorites/foods/${id}`),
};
