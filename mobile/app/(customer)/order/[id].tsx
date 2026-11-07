import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react-native";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { ZoomIn } from "react-native-reanimated";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/ErrorState";
import { FullScreenLoading } from "@/components/ui/Loading";
import { BankTransferLogo, EasypaisaLogo, JazzCashLogo } from "@/components/ui/PaymentLogo";
import { formatPKR, PriceRow } from "@/components/ui/PriceRow";
import { OrderTimeline } from "@/components/ui/OrderTimeline";
import { useKitchen } from "@/hooks/useKitchens";
import { useCancelOrder, useOrder } from "@/hooks/useOrders";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import type { PaymentMethod } from "@/types/api";

const CARD_SHADOW = { shadowColor: "#1F1C19", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 };

const STATUS_LABELS: Record<string, { label: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" }> = {
  pending: { label: "Awaiting Confirmation", tone: "warning" },
  accepted: { label: "Confirmed", tone: "primary" },
  preparing: { label: "Preparing", tone: "primary" },
  ready: { label: "Ready for Pickup", tone: "primary" },
  out_for_delivery: { label: "Out for Delivery", tone: "primary" },
  delivered: { label: "Delivered", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

function PaymentMethodLogo({ method }: { method: PaymentMethod }) {
  if (method === "easypaisa") return <EasypaisaLogo size={36} />;
  if (method === "jazzcash") return <JazzCashLogo size={36} />;
  if (method === "bank_transfer") return <BankTransferLogo size={36} />;
  const Icon = method === "card" ? CreditCard : Banknote;
  return (
    <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
      <Icon size={16} color="#665F57" />
    </View>
  );
}

export default function OrderDetailsScreen() {
  const { id, justPlaced } = useLocalSearchParams<{ id: string; justPlaced?: string }>();
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const { data: kitchen } = useKitchen(order?.kitchen_id);
  useOrderTracking(id);
  const cancelOrder = useCancelOrder();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  if (isLoading) return <FullScreenLoading />;
  if (isError || !order) return <ErrorState message="Couldn't load this order." onRetry={refetch} />;

  const canCancel = order.order_status === "pending" || order.order_status === "accepted";
  const isFinished = ["delivered", "rejected", "cancelled"].includes(order.order_status);
  const statusInfo = STATUS_LABELS[order.order_status] ?? { label: order.order_status, tone: "neutral" as const };
  const itemImage = order.items[0]?.image ?? null;
  const canContact = order.can_chat;

  const onCall = () => {
    if (!order.kitchen_phone) {
      toast.error("No phone number on file for this kitchen.");
      return;
    }
    Linking.openURL(`tel:${order.kitchen_phone}`);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-neutral-900">Order #{order.order_number}</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {justPlaced === "1" ? (
          <Animated.View entering={ZoomIn.duration(400)} className="mb-5 items-center gap-2 rounded-2xl bg-success-50 py-6">
            <CheckCircle2 size={40} color="#178A48" />
            <Text className="text-base font-bold text-success-700">Order placed successfully!</Text>
            <Text className="text-center text-xs text-success-600 px-6">
              {order.kitchen_name} has received your order and will confirm it shortly.
            </Text>
          </Animated.View>
        ) : null}

        {/* Item photo + kitchen contact */}
        <View className="mb-5 overflow-hidden rounded-2xl bg-white" style={CARD_SHADOW}>
          <View className="h-44 w-full bg-neutral-100">
            {itemImage ? (
              <Image source={{ uri: itemImage }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : null}
          </View>
          <View className="flex-row items-center gap-3 p-4">
            <View className="h-12 w-12 overflow-hidden rounded-full bg-neutral-100">
              {kitchen?.images[0] ? (
                <Image source={{ uri: kitchen.images[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : null}
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-bold text-neutral-900">{order.kitchen_name}</Text>
              <View className="mt-1 self-start">
                <Badge label={statusInfo.label} tone={statusInfo.tone} />
              </View>
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
              onPress={() => router.push(`/(customer)/chat/${order.id}`)}
              disabled={!canContact}
              hitSlop={8}
              className={`h-10 w-10 items-center justify-center rounded-full ${canContact ? "bg-primary-50" : "bg-neutral-100"}`}
            >
              <MessageCircle size={18} color={canContact ? "#F25C1F" : "#AFA79B"} />
            </Pressable>
          </View>
        </View>

        {/* Timeline */}
        <View className="mb-5 rounded-2xl bg-white p-4" style={CARD_SHADOW}>
          <OrderTimeline order={order} />
        </View>

        {/* Items */}
        <Text className="mb-2 text-sm font-bold text-neutral-900">Items</Text>
        <View className="mb-5 rounded-2xl bg-neutral-50 p-4">
          {order.items.map((item) => (
            <View key={item.item_id} className="py-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-neutral-700" numberOfLines={1}>
                  {item.quantity}× {item.name}
                </Text>
                <Text className="text-sm font-semibold text-neutral-800">{formatPKR(item.price * item.quantity)}</Text>
              </View>
              {item.customizations.length > 0 ? (
                <Text className="mt-0.5 text-xs text-neutral-500">{item.customizations.join(", ")}</Text>
              ) : null}
            </View>
          ))}
          <View className="my-2 h-px bg-neutral-200" />
          <PriceRow label="Subtotal" value={order.subtotal} />
          <PriceRow label="Delivery fee" value={order.delivery_fee} />
          <PriceRow label="Service fee" value={order.service_fee} />
          <View className="my-2 h-px bg-neutral-200" />
          <PriceRow label="Total" value={order.total} emphasis />
        </View>

        {/* Delivery address */}
        <Text className="mb-2 text-sm font-bold text-neutral-900">Delivery Address</Text>
        <View className="mb-5 flex-row items-start gap-3 rounded-2xl bg-neutral-50 p-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50">
            <MapPin size={16} color="#F25C1F" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-neutral-900">{order.address.label}</Text>
            <Text className="mt-0.5 text-sm text-neutral-600">{order.address.full_address}</Text>
          </View>
        </View>

        {/* Payment */}
        <Text className="mb-2 text-sm font-bold text-neutral-900">Payment</Text>
        <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-neutral-50 p-4">
          <PaymentMethodLogo method={order.payment_method} />
          <Text className="flex-1 text-sm capitalize text-neutral-700">{order.payment_method.replace("_", " ")}</Text>
          <Text className={`text-xs font-bold capitalize ${order.payment_status === "paid" ? "text-success-600" : "text-neutral-500"}`}>
            {order.payment_status}
          </Text>
        </View>
      </ScrollView>

      <View className="gap-2.5 border-t border-neutral-100 px-5 pb-8 pt-4">
        {canCancel ? (
          <Button label="Cancel Order" variant="outline" fullWidth onPress={() => setCancelModalVisible(true)} />
        ) : null}
        {isFinished ? (
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Button
                label="Reorder"
                variant="outline"
                fullWidth
                onPress={() => {
                  const item = order.items[0];
                  router.push({
                    pathname: "/(customer)/checkout",
                    params: {
                      foodId: item.food_id,
                      quantity: String(item.quantity),
                      customizations: JSON.stringify(item.customizations),
                    },
                  });
                }}
              />
            </View>
            {order.order_status === "delivered" ? (
              <View className="flex-1">
                <Button label="Leave a Review" fullWidth onPress={() => router.push(`/(customer)/review/${order.id}`)} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <ConfirmModal
        visible={cancelModalVisible}
        title="Cancel this order?"
        message="This can't be undone. The kitchen will be notified immediately."
        confirmLabel="Yes, Cancel"
        destructive
        onConfirm={() => {
          setCancelModalVisible(false);
          cancelOrder.mutate(
            { id: order.id },
            {
              onSuccess: () => toast.success("Order cancelled"),
              onError: (error) => toast.error(getApiErrorMessage(error)),
            }
          );
        }}
        onCancel={() => setCancelModalVisible(false)}
      />
    </SafeAreaView>
  );
}
