import { useLocalSearchParams } from "expo-router";

import { ChatThread } from "@/components/chat/ChatThread";
import { ErrorState } from "@/components/ui/ErrorState";
import { FullScreenLoading } from "@/components/ui/Loading";
import { useOrder } from "@/hooks/useOrders";

export default function KitchenChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);

  if (isLoading) return <FullScreenLoading />;
  if (isError || !order) return <ErrorState message="Couldn't load this conversation." onRetry={refetch} />;

  return (
    <ChatThread
      orderId={order.id}
      title={order.customer_name ?? "Customer"}
      subtitle={`Order #${order.order_number}`}
      canChat={order.can_chat}
    />
  );
}
