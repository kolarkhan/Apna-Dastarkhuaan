import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import type { Order, OrderStatus } from "@/types/api";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Order placed — waiting for kitchen",
  accepted: "Kitchen accepted your order",
  preparing: "Your food is being prepared",
  ready: "Ready — waiting for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Order rejected",
  cancelled: "Order cancelled",
};

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  pending: 0.1,
  accepted: 0.3,
  preparing: 0.5,
  ready: 0.7,
  out_for_delivery: 0.9,
  delivered: 1,
  rejected: 1,
  cancelled: 1,
};

export function ActiveOrderCard({ order }: { order: Order }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} className="mx-5 mb-2">
      <Pressable
        onPress={() => router.push(`/(customer)/order/${order.id}`)}
        className="overflow-hidden rounded-2xl bg-neutral-900 p-4 active:opacity-90"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-wide text-primary-300">Live Order</Text>
          <ChevronRight size={16} color="#fff" />
        </View>
        <Text className="mt-1.5 text-base font-bold text-white">{order.kitchen_name}</Text>
        <Text className="mt-0.5 text-sm text-neutral-300">{STATUS_LABEL[order.order_status]}</Text>
        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-700">
          <View
            className="h-full rounded-full bg-primary-500"
            style={{ width: `${STATUS_PROGRESS[order.order_status] * 100}%` }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}
