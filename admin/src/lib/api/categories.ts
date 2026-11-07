import { apiClient } from "@/lib/api";
import type { Category } from "@/types/api";

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/categories").then((r) => r.data),
  create: (payload: { name: string; icon?: string; image?: string }) =>
    apiClient.post<Category>("/categories", payload).then((r) => r.data),
  update: (id: string, payload: { name?: string; icon?: string; image?: string }) =>
    apiClient.patch<Category>(`/categories/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/categories/${id}`),
};
