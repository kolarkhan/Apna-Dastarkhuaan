import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "@/lib/api/admin";
import type { OrderStatus } from "@/types/api";

export const adminKeys = {
  stats: ["admin", "stats"] as const,
  customers: (params: unknown) => ["admin", "customers", params] as const,
  kitchens: (params: unknown) => ["admin", "kitchens", params] as const,
  foods: (params: unknown) => ["admin", "foods", params] as const,
  orders: (params: unknown) => ["admin", "orders", params] as const,
  reviews: (params: unknown) => ["admin", "reviews", params] as const,
  payments: (params: unknown) => ["admin", "payments", params] as const,
};

export function useDashboardStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: adminApi.stats, refetchInterval: 30_000 });
}

export function useCustomers(page: number, search?: string) {
  return useQuery({
    queryKey: adminKeys.customers({ page, search }),
    queryFn: () => adminApi.customers({ page, page_size: 20, search }),
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.suspendUser(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
  });
}

export function useUnsuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.unsuspendUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
  });
}

export function useAdminKitchens(page: number, statusFilter?: string) {
  return useQuery({
    queryKey: adminKeys.kitchens({ page, statusFilter }),
    queryFn: () => adminApi.kitchens({ page, page_size: 20, status_filter: statusFilter }),
  });
}

export function useApproveKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.approveKitchen(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "kitchens"] });
      qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useRejectKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectKitchen(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "kitchens"] });
      qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useVerifyKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.verifyKitchen(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "kitchens"] });
      qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useSuspendKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.suspendKitchen(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "kitchens"] }),
  });
}

export function useUnsuspendKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.unsuspendKitchen(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "kitchens"] }),
  });
}

export function useAdminFoods(page: number) {
  return useQuery({
    queryKey: adminKeys.foods({ page }),
    queryFn: () => adminApi.foods({ page, page_size: 20 }),
  });
}

export function useRemoveFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.removeFood(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "foods"] }),
  });
}

export function useAdminOrders(page: number, statusFilter?: OrderStatus) {
  return useQuery({
    queryKey: adminKeys.orders({ page, statusFilter }),
    queryFn: () => adminApi.orders({ page, page_size: 20, status_filter: statusFilter }),
  });
}

export function useAdminReviews(page: number) {
  return useQuery({
    queryKey: adminKeys.reviews({ page }),
    queryFn: () => adminApi.reviews({ page, page_size: 20 }),
  });
}

export function useRemoveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.removeReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}

export function useAdminPayments(page: number) {
  return useQuery({
    queryKey: adminKeys.payments({ page }),
    queryFn: () => adminApi.payments({ page, page_size: 20 }),
  });
}

export function useBroadcastNotification() {
  return useMutation({ mutationFn: adminApi.broadcastNotification });
}
