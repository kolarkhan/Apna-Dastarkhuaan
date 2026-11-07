import { apiClient } from "@/services/api/client";
import type { BusinessHourEntry, GeoPoint, Kitchen, PagedResponse, PaymentDetails } from "@/types/api";

export interface ListKitchensParams {
  lat?: number;
  lng?: number;
  search?: string;
  verified?: boolean;
  open_now?: boolean;
  min_rating?: number;
  cuisine?: string;
  sort?: "distance" | "rating" | "newest";
  page?: number;
  page_size?: number;
}

export interface CreateKitchenPayload {
  name: string;
  description: string;
  address: string;
  location: GeoPoint;
  cuisine_tags: string[];
  business_hours: BusinessHourEntry[];
  payment_details?: PaymentDetails;
  auto_accept_orders?: boolean;
}

export const kitchensApi = {
  list: (params: ListKitchensParams) => apiClient.get<PagedResponse<Kitchen>>("/kitchens", { params }).then((r) => r.data),
  getById: (id: string) => apiClient.get<Kitchen>(`/kitchens/${id}`).then((r) => r.data),
  mine: () => apiClient.get<Kitchen>("/kitchens/mine").then((r) => r.data),
  create: (payload: CreateKitchenPayload) => apiClient.post<Kitchen>("/kitchens", payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreateKitchenPayload>) =>
    apiClient.patch<Kitchen>(`/kitchens/${id}`, payload).then((r) => r.data),
  updateBusinessHours: (id: string, business_hours: BusinessHourEntry[]) =>
    apiClient.patch<Kitchen>(`/kitchens/${id}/business-hours`, { business_hours }).then((r) => r.data),
  toggleOpen: (id: string) => apiClient.patch<{ is_open: boolean }>(`/kitchens/${id}/toggle-open`).then((r) => r.data),
  uploadImage: (id: string, formData: FormData) =>
    apiClient
      .post<{ image: string }>(`/kitchens/${id}/images`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data),
};
