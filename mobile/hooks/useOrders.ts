import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ordersApi, type CreateOrderPayload } from "@/services/api/orders";
import { queryKeys } from "@/services/queryClient";
import type { OrderStatus } from "@/types/api";

export function useOrders(statusFilter?: OrderStatus) {
  return useQuery({
    queryKey: queryKeys.orders.list({ statusFilter }),
    queryFn: () => ordersApi.list({ status_filter: statusFilter }),
  });
}

export function useActiveOrder() {
  return useQuery({
    queryKey: queryKeys.orders.active,
    queryFn: ordersApi.active,
    refetchInterval: 20_000,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => ordersApi.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.active });
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => ordersApi.cancel(id, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.orders.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.active });
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      ordersApi.updateStatus(id, status, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.orders.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });
}
