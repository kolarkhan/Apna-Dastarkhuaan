import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { tokenStorage } from "@/utils/secureStorage";
import { queryKeys } from "@/services/queryClient";
import type { ChatMessage, Order, OrderStatus } from "@/types/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_URL = API_URL.replace(/^http/, "ws");

/**
 * Subscribes to live order-status updates over WebSocket, and keeps the
 * TanStack Query cache for this order in sync. Falls back to periodic
 * polling (handled by useOrder's own refetch) if the socket can't connect —
 * the caller doesn't need to do anything special either way.
 */
export function useOrderTracking(orderId: string | undefined) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    let socket: WebSocket | null = null;

    (async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token || cancelled) return;

      socket = new WebSocket(`${WS_URL}/ws/orders/${orderId}?token=${token}`);
      socketRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onclose = () => setConnected(false);
      socket.onerror = () => setConnected(false);

      socket.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data as string) as {
            type: string;
            status?: OrderStatus;
            at?: string;
            message?: ChatMessage;
          };

          if (frame.type === "order_status" || frame.type === "connected") {
            queryClient.setQueryData<Order | undefined>(queryKeys.orders.detail(orderId), (prev) =>
              prev && frame.status ? { ...prev, order_status: frame.status, updated_at: frame.at ?? prev.updated_at } : prev
            );
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.active });
          } else if (frame.type === "chat_message" && frame.message) {
            const incoming = frame.message;
            queryClient.setQueryData<ChatMessage[] | undefined>(queryKeys.chat.messages(orderId), (prev) => {
              if (!prev) return [incoming];
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          }
        } catch {
          // ignore malformed frames
        }
      };
    })();

    return () => {
      cancelled = true;
      socket?.close();
      socketRef.current = null;
    };
  }, [orderId, queryClient]);

  return { connected };
}
