import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet } from "lucide-react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatPKR } from "@/components/ui/PriceRow";
import { useKitchenEarningsHistory, useKitchenEarningsSummary } from "@/hooks/useKitchenEarnings";

export default function EarningsScreen() {
  const { data: summary } = useKitchenEarningsSummary();
  const { data: history, isLoading } = useKitchenEarningsHistory();

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <View className="mx-5 mt-2 items-center rounded-3xl bg-neutral-900 py-8">
        <Text className="text-xs font-semibold uppercase tracking-wide text-primary-300">Total Earnings</Text>
        <Text className="mt-2 text-3xl font-extrabold text-white">{formatPKR(summary?.total_earnings ?? 0)}</Text>
        <View className="mt-4 flex-row gap-8">
          <View className="items-center">
            <Text className="text-lg font-bold text-white">{formatPKR(summary?.today_sales ?? 0)}</Text>
            <Text className="text-xs text-neutral-400">Today</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-white">{summary?.completed_orders ?? 0}</Text>
            <Text className="text-xs text-neutral-400">Completed Orders</Text>
          </View>
        </View>
      </View>

      <Text className="mb-2 mt-6 px-5 text-sm font-bold text-neutral-900">Payout History</Text>

      {!isLoading && (history?.items.length ?? 0) === 0 ? (
        <EmptyState icon={Wallet} title="No earnings yet" message="Completed orders will appear here." />
      ) : (
        <FlatList
          data={history?.items ?? []}
          keyExtractor={(item) => item.order_id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between rounded-xl bg-neutral-50 px-4 py-3.5">
              <View>
                <Text className="text-sm font-bold text-neutral-900">#{item.order_number}</Text>
                <Text className="text-xs text-neutral-500">{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text className="text-sm font-bold text-success-600">+{formatPKR(item.amount)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
