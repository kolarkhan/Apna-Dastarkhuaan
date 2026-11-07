import { router } from "expo-router";
import { Clock, ListChecks, Package, Plus, ReceiptText, TrendingUp, Wallet } from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VerifiedBadge } from "@/components/ui/Badge";
import { formatPKR } from "@/components/ui/PriceRow";
import { useKitchenEarningsSummary } from "@/hooks/useKitchenEarnings";
import { useMyKitchen } from "@/hooks/useKitchens";
import { kitchensApi } from "@/services/api/kitchens";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryClient";

export default function KitchenDashboardScreen() {
  const { data: kitchen, refetch: refetchKitchen } = useMyKitchen();
  const { data: summary, isLoading, refetch: refetchSummary } = useKitchenEarningsSummary();
  const queryClient = useQueryClient();

  const onToggleOpen = async () => {
    if (!kitchen) return;
    try {
      await kitchensApi.toggleOpen(kitchen.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetchKitchen(); refetchSummary(); }} />}
      >
        {kitchen ? (
          <View className="mx-5 mt-5 gap-3 rounded-2xl border border-neutral-100 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-2">
                <Text numberOfLines={1} className="flex-1 text-base font-bold text-neutral-900">{kitchen.name}</Text>
                {kitchen.verified ? <VerifiedBadge /> : null}
              </View>
              <Switch value={kitchen.is_open} onValueChange={onToggleOpen} trackColor={{ true: "#F25C1F" }} />
            </View>
            {kitchen.status === "pending" ? (
              <View className="rounded-lg bg-warning-50 px-3 py-2">
                <Text className="text-xs font-semibold text-warning-700">⏳ Awaiting admin approval — your kitchen isn't visible to customers yet.</Text>
              </View>
            ) : kitchen.status === "rejected" ? (
              <View className="rounded-lg bg-danger-50 px-3 py-2">
                <Text className="text-xs font-semibold text-danger-700">Your kitchen application was rejected. Contact support for details.</Text>
              </View>
            ) : (
              <Text className="text-xs text-neutral-500">{kitchen.is_open ? "Open for orders" : "Closed — customers can't order right now"}</Text>
            )}
          </View>
        ) : null}

        <View className="mt-6 flex-row flex-wrap gap-3 px-5">
          <StatCard icon={TrendingUp} label="Today's Sales" value={formatPKR(summary?.today_sales ?? 0)} tone="primary" />
          <StatCard icon={Package} label="Today's Orders" value={String(summary?.today_orders ?? 0)} tone="neutral" />
          <StatCard icon={Clock} label="Pending" value={String(summary?.pending_orders ?? 0)} tone="warning" />
          <StatCard icon={ListChecks} label="Active" value={String(summary?.active_orders ?? 0)} tone="success" />
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-base font-bold text-neutral-900">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            <QuickAction icon={Plus} label="Add Food" onPress={() => router.push("/(kitchen)/menu/add")} />
            <QuickAction icon={ReceiptText} label="View Orders" onPress={() => router.push("/(kitchen)/(tabs)/orders")} />
            <QuickAction icon={ListChecks} label="Manage Menu" onPress={() => router.push("/(kitchen)/(tabs)/menu")} />
            <QuickAction icon={Wallet} label="View Earnings" onPress={() => router.push("/(kitchen)/(tabs)/earnings")} />
          </View>
        </View>

        {summary && summary.popular_foods.length > 0 ? (
          <View className="mt-6 px-5">
            <Text className="mb-3 text-base font-bold text-neutral-900">Popular Food</Text>
            <View className="gap-2">
              {summary.popular_foods.map((food, i) => (
                <View key={food.name} className="flex-row items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                  <Text className="text-sm font-semibold text-neutral-800">{i + 1}. {food.name}</Text>
                  <Text className="text-xs text-neutral-500">{food.quantity} sold</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof TrendingUp; label: string; value: string; tone: "primary" | "success" | "warning" | "neutral" }) {
  const toneClasses = {
    primary: "bg-primary-50",
    success: "bg-success-50",
    warning: "bg-warning-50",
    neutral: "bg-neutral-100",
  }[tone];
  const iconColor = { primary: "#F25C1F", success: "#178A48", warning: "#B45309", neutral: "#665F57" }[tone];

  return (
    <View className="w-[47%] gap-2 rounded-2xl bg-white p-4" style={{ shadowColor: "#1F1C19", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
      <View className={`h-9 w-9 items-center justify-center rounded-full ${toneClasses}`}>
        <Icon size={16} color={iconColor} />
      </View>
      <Text className="text-lg font-extrabold text-neutral-900">{value}</Text>
      <Text className="text-xs text-neutral-500">{label}</Text>
    </View>
  );
}

function QuickAction({ icon: Icon, label, onPress }: { icon: typeof Plus; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="w-[47%] items-center gap-2 rounded-2xl border border-neutral-100 py-4 active:bg-neutral-50">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50">
        <Icon size={18} color="#F25C1F" />
      </View>
      <Text className="text-xs font-semibold text-neutral-700">{label}</Text>
    </Pressable>
  );
}
