import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { chatApi } from "@/services/api/chat";
import { queryKeys } from "@/services/queryClient";
import type { ChatMessage } from "@/types/api";

export function useChatMessages(orderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.messages(orderId ?? ""),
    queryFn: () => chatApi.list(orderId as string),
    enabled: !!orderId,
  });
}

export function useSendMessage(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => chatApi.send(orderId, text),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessage[] | undefined>(queryKeys.chat.messages(orderId), (prev) => {
        if (!prev) return [message];
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
  });
}
