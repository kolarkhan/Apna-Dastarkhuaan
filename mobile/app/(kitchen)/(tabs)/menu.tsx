import { router } from "expo-router";
import { Image } from "expo-image";
import { Trash2, UtensilsCrossed } from "lucide-react-native";
import { FlatList, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/EmptyState";
import { FullScreenLoading } from "@/components/ui/Loading";
import { formatPKR } from "@/components/ui/PriceRow";
import { useFoods } from "@/hooks/useFoods";
import { useMyKitchen } from "@/hooks/useKitchens";
import { useDeleteFood, useSetFoodAvailability } from "@/hooks/useMenu";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import type { FoodItem } from "@/types/api";

export default function MenuScreen() {
  const { data: kitchen } = useMyKitchen();
  const { data: foodsPage, isLoading } = useFoods({ kitchen_id: kitchen?.id, page_size: 100 });
  const setAvailability = useSetFoodAvailability();
  const deleteFood = useDeleteFood();

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      {isLoading ? (
        <FullScreenLoading />
      ) : (foodsPage?.items.length ?? 0) === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No food items yet" message="Add your first dish to start selling." actionLabel="Add Food" onAction={() => router.push("/(kitchen)/menu/add")} />
      ) : (
        <FlatList
          data={foodsPage?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <FoodRow
              food={item}
              onToggleAvailable={(available) =>
                setAvailability.mutate(
                  { id: item.id, available },
                  { onError: (error) => toast.error(getApiErrorMessage(error)) }
                )
              }
              onDelete={() =>
                deleteFood.mutate(item.id, {
                  onSuccess: () => toast.success("Removed from menu"),
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FoodRow({ food, onToggleAvailable, onDelete }: { food: FoodItem; onToggleAvailable: (v: boolean) => void; onDelete: () => void }) {
  return (
    <Pressable
      onPress={() => router.push(`/(kitchen)/menu/${food.id}/edit`)}
      className="flex-row items-center gap-3 rounded-2xl border border-neutral-100 p-3"
    >
      {food.images[0] ? <Image source={{ uri: food.images[0] }} style={{ width: 60, height: 60, borderRadius: 12 }} contentFit="cover" /> : null}
      <View className="flex-1">
        <Text className="text-sm font-bold text-neutral-900">{food.name}</Text>
        <Text className="text-xs text-neutral-500">{formatPKR(food.price)} · {food.preparation_time_minutes} min</Text>
      </View>
      <View className="items-center gap-2">
        <Switch value={food.available} onValueChange={onToggleAvailable} trackColor={{ true: "#F25C1F" }} />
        <Pressable onPress={onDelete} hitSlop={8}>
          <Trash2 size={15} color="#AFA79B" />
        </Pressable>
      </View>
    </Pressable>
  );
}
