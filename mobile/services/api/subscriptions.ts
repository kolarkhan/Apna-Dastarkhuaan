import { apiClient } from "@/services/api/client";
import type { SubscriptionPaymentMethod, SubscriptionPlan, SubscriptionStatus } from "@/types/api";

export const subscriptionsApi = {
  plans: () => apiClient.get<SubscriptionPlan[]>("/subscriptions/plans").then((r) => r.data),
  me: () => apiClient.get<SubscriptionStatus>("/subscriptions/me").then((r) => r.data),
  subscribe: (paymentMethod: SubscriptionPaymentMethod) =>
    apiClient
      .post<SubscriptionStatus & { message: string }>("/subscriptions/subscribe", { payment_method: paymentMethod })
      .then((r) => r.data),
  cancel: () =>
    apiClient.post<SubscriptionStatus & { message: string }>("/subscriptions/cancel").then((r) => r.data),
};
