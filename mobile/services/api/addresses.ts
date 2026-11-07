import { apiClient } from "@/services/api/client";
import type { Address, GeoPoint } from "@/types/api";

export interface CreateAddressPayload {
  label: string;
  full_address: string;
  area?: string;
  city?: string;
  location?: GeoPoint;
  is_default?: boolean;
  instructions?: string;
}

export const addressesApi = {
  list: () => apiClient.get<Address[]>("/addresses").then((r) => r.data),
  create: (payload: CreateAddressPayload) => apiClient.post<Address>("/addresses", payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreateAddressPayload>) =>
    apiClient.patch<Address>(`/addresses/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/addresses/${id}`),
};
