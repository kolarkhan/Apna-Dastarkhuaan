import { apiClient } from "@/services/api/client";
import type { Category } from "@/types/api";

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/categories").then((r) => r.data),
};
