import { router } from "expo-router";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAddresses, useDeleteAddress } from "@/hooks/useAddresses";

export default function AddressesScreen() {
  const { data: addresses, isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">My Addresses</Text>
      </View>

      {!isLoading && (addresses?.length ?? 0) === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" message="Add a delivery address to check out faster next time." actionLabel="Add Address" onAction={() => router.push("/(customer)/address/add")} />
      ) : (
        <FlatList
          data={addresses ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 rounded-2xl border border-neutral-100 p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                <MapPin size={16} color="#F25C1F" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-bold text-neutral-900">{item.label}</Text>
                  {item.is_default ? (
                    <View className="rounded-full bg-primary-50 px-2 py-0.5">
                      <Text className="text-[10px] font-bold text-primary-600">DEFAULT</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="mt-0.5 text-xs text-neutral-500">{item.full_address}</Text>
              </View>
              <Pressable onPress={() => deleteAddress.mutate(item.id)} hitSlop={8}>
                <Trash2 size={16} color="#AFA79B" />
              </Pressable>
            </View>
          )}
        />
      )}

      <View className="px-5 pb-8 pt-2">
        <Button label="Add New Address" variant="outline" fullWidth icon={<Plus size={16} color="#F25C1F" />} onPress={() => router.push("/(customer)/address/add")} />
      </View>
    </SafeAreaView>
  );
}
