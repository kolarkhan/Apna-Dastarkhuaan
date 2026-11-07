import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  kitchens: {
    list: (params: unknown) => ["kitchens", "list", params] as const,
    detail: (id: string) => ["kitchens", "detail", id] as const,
    mine: ["kitchens", "mine"] as const,
  },
  foods: {
    list: (params: unknown) => ["foods", "list", params] as const,
    detail: (id: string) => ["foods", "detail", id] as const,
  },
  categories: {
    list: ["categories", "list"] as const,
  },
  addresses: {
    list: ["addresses", "list"] as const,
  },
  orders: {
    list: (params: unknown) => ["orders", "list", params] as const,
    active: ["orders", "active"] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  chat: {
    messages: (orderId: string) => ["chat", "messages", orderId] as const,
  },
  reviews: {
    list: (params: unknown) => ["reviews", "list", params] as const,
    mine: ["reviews", "mine"] as const,
  },
  favorites: {
    kitchens: ["favorites", "kitchens"] as const,
    foods: ["favorites", "foods"] as const,
  },
  notifications: {
    list: (params: unknown) => ["notifications", "list", params] as const,
    unreadCount: ["notifications", "unreadCount"] as const,
  },
  kitchenEarnings: {
    summary: ["kitchenEarnings", "summary"] as const,
    history: (params: unknown) => ["kitchenEarnings", "history", params] as const,
  },
  subscriptions: {
    plans: ["subscriptions", "plans"] as const,
    me: ["subscriptions", "me"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
};
