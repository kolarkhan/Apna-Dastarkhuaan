import { useEffect } from "react";
import { Check, X } from "lucide-react-native";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import type { Order, OrderStatus } from "@/types/api";

const STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: "pending", label: "Order Confirmed", description: "We've received your order" },
  { status: "accepted", label: "Kitchen Accepted", description: "Freshly cooked and on its way soon" },
  { status: "delivered", label: "Delivered", description: "Enjoy your meal!" },
];

// Orders placed before the flow was simplified may still carry one of these
// now-retired intermediate statuses — treat them as "accepted" for display.
const LEGACY_STATUS_TIER: Partial<Record<OrderStatus, OrderStatus>> = {
  preparing: "accepted",
  ready: "accepted",
  out_for_delivery: "accepted",
};

function formatTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function OrderTimeline({ order }: { order: Order }) {
  if (order.order_status === "rejected" || order.order_status === "cancelled") {
    return (
      <View className="flex-row items-start gap-3 rounded-2xl bg-danger-50 p-4">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-danger-500">
          <X size={16} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-danger-700">
            {order.order_status === "rejected" ? "Order Rejected" : "Order Cancelled"}
          </Text>
          {order.cancellation_reason ? (
            <Text className="mt-0.5 text-sm text-danger-600">{order.cancellation_reason}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  const effectiveStatus = LEGACY_STATUS_TIER[order.order_status] ?? order.order_status;
  const currentIndex = STEPS.findIndex((s) => s.status === effectiveStatus);
  const historyMap = new Map(order.status_history.map((h) => [h.status, h.at]));

  return (
    <View>
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <View key={step.status} className="flex-row">
            <View className="items-center" style={{ width: 32 }}>
              <StepDot done={isDone} active={isActive} />
              {!isLast ? <View className={`w-0.5 flex-1 ${isDone ? "bg-success-500" : "bg-neutral-200"}`} style={{ minHeight: 32 }} /> : null}
            </View>
            <View className="flex-1 pb-6 pl-3">
              <View className="flex-row items-center justify-between">
                <Text className={`text-sm font-bold ${isDone || isActive ? "text-neutral-900" : "text-neutral-400"}`}>
                  {step.label}
                </Text>
                <Text className="text-xs text-neutral-400">{formatTime(historyMap.get(step.status))}</Text>
              </View>
              <Text className={`mt-0.5 text-xs ${isDone || isActive ? "text-neutral-500" : "text-neutral-350"}`}>
                {step.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StepDot({ done, active }: { done: boolean; active: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(withSequence(withTiming(1.25, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [active, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (done) {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-success-500">
        <Check size={14} color="#fff" />
      </View>
    );
  }

  return (
    <Animated.View
      style={style}
      className={`h-7 w-7 items-center justify-center rounded-full ${active ? "bg-primary-500" : "bg-neutral-200"}`}
    >
      <View className={`h-2.5 w-2.5 rounded-full ${active ? "bg-white" : "bg-neutral-400"}`} />
    </Animated.View>
  );
}
