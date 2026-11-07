import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addressesApi, type CreateAddressPayload } from "@/services/api/addresses";
import { queryKeys } from "@/services/queryClient";

export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.addresses.list,
    queryFn: addressesApi.list,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAddressPayload) => addressesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.list }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAddressPayload> }) =>
      addressesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.list }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.list }),
  });
}
