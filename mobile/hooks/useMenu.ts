import { useMutation, useQueryClient } from "@tanstack/react-query";

import { foodsApi, type CreateFoodPayload } from "@/services/api/foods";

export function useCreateFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFoodPayload) => foodsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });
}

export function useUpdateFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateFoodPayload> }) => foodsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });
}

export function useSetFoodAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => foodsApi.setAvailability(id, available),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });
}

export function useDeleteFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foodsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });
}
