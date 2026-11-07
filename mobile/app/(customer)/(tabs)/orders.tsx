import { useState } from "react";
import { router } from "expo-router";
import { ReceiptText } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import { formatPKR } from "@/components/ui/PriceRow";
import { useOrders } from "@/hooks/useOrders";
import type { Order, OrderStatus } from "@/types/api";

type Filter = "active" | "past";

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "out_for_delivery"];

const STATUS_TONE: Record<OrderStatus, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  accepted: "primary",
  preparing: "primary",
  ready: "primary",
  out_for_delivery: "primary",
  delivered: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export default function OrdersScreen() {
  const [filter, setFilter] = useState<Filter>("active");
  const { data, isLoading } = useOrders();

  const orders = (data?.items ?? []).filter((o) =>
    filter === "active" ? ACTIVE_STATUSES.includes(o.order_status) : !ACTIVE_STATUSES.includes(o.order_status)
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <View className="mt-2 flex-row gap-2 px-5">
        <TabButton label="Active" active={filter === "active"} onPress={() => setFilter("active")} />
        <TabButton label="Past" active={filter === "past"} onPress={() => setFilter("past")} />
      </View>

      {isLoading ? (
        <View className="mt-4">
          {[1, 2, 3].map((i) => <ListRowSkeleton key={i} />)}
        </View>
      ) : orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No orders yet" message={filter === "active" ? "Your active orders will show up here." : "Your past orders will show up here."} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => <OrderRow order={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <Pressable onPress={() => router.push(`/(customer)/order/${order.id}`)} className="rounded-2xl border border-neutral-100 p-4 active:bg-neutral-50">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-neutral-900">{order.kitchen_name}</Text>
        <Badge label={order.order_status.replace(/_/g, " ")} tone={STATUS_TONE[order.order_status]} />
      </View>
      <Text className="mt-1 text-xs text-neutral-500">
        Order #{order.order_number} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
      </Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-neutral-400">{new Date(order.created_at).toLocaleDateString()}</Text>
        <Text className="text-sm font-bold text-neutral-900">{formatPKR(order.total)}</Text>
      </View>
    </Pressable>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary-500" : "bg-neutral-100"}`}>
      <Text className={`text-sm font-bold ${active ? "text-white" : "text-neutral-600"}`}>{label}</Text>
    </Pressable>
  );
}
