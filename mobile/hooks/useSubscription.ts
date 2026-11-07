import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { subscriptionsApi } from "@/services/api/subscriptions";
import { queryKeys } from "@/services/queryClient";
import type { SubscriptionPaymentMethod } from "@/types/api";

export function useSubscriptionPlans() {
  return useQuery({ queryKey: queryKeys.subscriptions.plans, queryFn: subscriptionsApi.plans, staleTime: Infinity });
}

export function useMySubscription() {
  return useQuery({ queryKey: queryKeys.subscriptions.me, queryFn: subscriptionsApi.me });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethod: SubscriptionPaymentMethod) => subscriptionsApi.subscribe(paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionsApi.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
    },
  });
}
