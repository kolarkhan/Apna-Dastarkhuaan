import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react-native";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/ErrorState";
import { FullScreenLoading } from "@/components/ui/Loading";
import { formatPKR, PriceRow } from "@/components/ui/PriceRow";
import { useOrder, useUpdateOrderStatus } from "@/hooks/useOrders";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import type { OrderStatus } from "@/types/api";

const CARD_SHADOW = { shadowColor: "#1F1C19", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 };

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  accepted: { status: "delivered", label: "Mark as Delivered" },
};

export default function KitchenOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  if (isLoading) return <FullScreenLoading />;
  if (isError || !order) return <ErrorState message="Couldn't load this order." onRetry={refetch} />;

  const nextAction = NEXT_STATUS[order.order_status];
  const itemImage = order.items[0]?.image ?? null;
  const canContact = order.can_chat;

  const onCall = () => {
    if (!order.customer_phone) {
      toast.error("No phone number on file for this customer.");
      return;
    }
    Linking.openURL(`tel:${order.customer_phone}`);
  };

  const advance = (status: OrderStatus, reason?: string) => {
    updateStatus.mutate(
      { id: order.id, status, reason },
      {
        onSuccess: () =>
          toast.success(status === "rejected" ? "Order rejected" : status === "cancelled" ? "Order cancelled" : "Order updated"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      }
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-neutral-900">Order #{order.order_number}</Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="mb-5 overflow-hidden rounded-2xl bg-white" style={CARD_SHADOW}>
          <View className="h-44 w-full bg-neutral-100">
            {itemImage ? (
              <Image source={{ uri: itemImage }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : null}
          </View>
          <View className="flex-row items-center gap-3 p-4">
            <View className="h-12 w-12 overflow-hidden rounded-full bg-secondary-100">
              {order.customer_avatar ? (
                <Image source={{ uri: order.customer_avatar }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="text-base font-extrabold text-secondary-700">
                    {(order.customer_name ?? "C").charAt(0)}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-bold text-neutral-900">{order.customer_name ?? "Customer"}</Text>
              <Text className="mt-0.5 text-xs capitalize text-neutral-500">{order.order_status.replace(/_/g, " ")}</Text>
            </View>
            <Pressable
              onPress={onCall}
              disabled={!canContact}
              hitSlop={8}
              className={`h-10 w-10 items-center justify-center rounded-full ${canContact ? "bg-success-50" : "bg-neutral-100"}`}
            >
              <Phone size={18} color={canContact ? "#178A48" : "#AFA79B"} />
            </Pressable>
            <Pressable
              onPress={() => router.push(`/(kitchen)/chat/${order.id}`)}
              disabled={!canContact}
              hitSlop={8}
              className={`h-10 w-10 items-center justify-center rounded-full ${canContact ? "bg-primary-50" : "bg-neutral-100"}`}
            >
              <MessageCircle size={18} color={canContact ? "#F25C1F" : "#AFA79B"} />
            </Pressable>
          </View>
        </View>

        <Text className="mb-2 text-sm font-bold text-neutral-900">Items</Text>
        <View className="mb-6 rounded-2xl bg-neutral-50 p-4">
          {order.items.map((item) => (
            <View key={item.item_id} className="py-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm font-semibold text-neutral-800">{item.quantity}× {item.name}</Text>
                <Text className="text-sm font-semibold text-neutral-800">{formatPKR(item.price * item.quantity)}</Text>
              </View>
              {item.customizations.length > 0 ? (
                <Text className="text-xs text-neutral-500">{item.customizations.join(", ")}</Text>
              ) : null}
              {item.special_instructions ? (
                <Text className="text-xs italic text-neutral-400">"{item.special_instructions}"</Text>
              ) : null}
            </View>
          ))}
          <View className="my-2 h-px bg-neutral-200" />
          <PriceRow label="Total" value={order.total} emphasis />
        </View>

        <Text className="mb-2 text-sm font-bold text-neutral-900">Delivery Address</Text>
        <View className="mb-6 rounded-2xl bg-neutral-50 p-4">
          <Text className="text-sm text-neutral-700">{order.address.full_address}</Text>
          {order.address.instructions ? <Text className="mt-1 text-xs text-neutral-500">{order.address.instructions}</Text> : null}
        </View>

        <Text className="mb-2 text-sm font-bold text-neutral-900">Payment</Text>
        <View className="rounded-2xl bg-neutral-50 p-4">
          <Text className="text-sm capitalize text-neutral-700">{order.payment_method.replace("_", " ")} · {order.payment_status}</Text>
        </View>
      </ScrollView>

      <View className="gap-2.5 border-t border-neutral-100 px-5 pb-8 pt-4">
        {order.order_status === "pending" ? (
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Button label="Reject" variant="outline" fullWidth onPress={() => setRejectModalVisible(true)} />
            </View>
            <View className="flex-1">
              <Button label="Accept Order" fullWidth loading={updateStatus.isPending} onPress={() => advance("accepted")} />
            </View>
          </View>
        ) : nextAction ? (
          <>
            <Button label={nextAction.label} fullWidth loading={updateStatus.isPending} onPress={() => advance(nextAction.status)} />
            <Button label="Cancel Order" variant="outline" fullWidth onPress={() => setCancelModalVisible(true)} />
          </>
        ) : null}
      </View>

      <ConfirmModal
        visible={rejectModalVisible}
        title="Reject this order?"
        message="The customer will be notified that you can't fulfill this order."
        confirmLabel="Reject Order"
        destructive
        onConfirm={() => {
          setRejectModalVisible(false);
          advance("rejected", "Kitchen unable to fulfill this order");
        }}
        onCancel={() => setRejectModalVisible(false)}
      />

      <ConfirmModal
        visible={cancelModalVisible}
        title="Cancel this order?"
        message="The customer will be notified immediately that their order has been cancelled."
        confirmLabel="Cancel Order"
        destructive
        onConfirm={() => {
          setCancelModalVisible(false);
          advance("cancelled", "Kitchen cancelled this order");
        }}
        onCancel={() => setCancelModalVisible(false)}
      />
    </SafeAreaView>
  );
}
