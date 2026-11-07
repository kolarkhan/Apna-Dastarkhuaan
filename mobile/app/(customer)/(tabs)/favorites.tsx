import { useState } from "react";
import { router } from "expo-router";
import { Heart } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/EmptyState";
import { FoodCard } from "@/components/ui/FoodCard";
import { KitchenCard } from "@/components/ui/KitchenCard";
import { useFavoriteFoods, useFavoriteKitchens, useToggleFavoriteKitchen } from "@/hooks/useFavorites";

type Tab = "kitchens" | "food";

export default function FavoritesScreen() {
  const [tab, setTab] = useState<Tab>("kitchens");
  const { data: kitchens, isLoading: kitchensLoading } = useFavoriteKitchens();
  const { data: foods, isLoading: foodsLoading } = useFavoriteFoods();
  const toggleKitchen = useToggleFavoriteKitchen();

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <View className="mt-2 flex-row gap-2 px-5">
        <TabButton label="Kitchens" active={tab === "kitchens"} onPress={() => setTab("kitchens")} />
        <TabButton label="Food" active={tab === "food"} onPress={() => setTab("food")} />
      </View>

      {tab === "kitchens" ? (
        !kitchensLoading && (kitchens?.length ?? 0) === 0 ? (
          <EmptyState icon={Heart} title="No favorite kitchens yet" message="Tap the heart on any kitchen to save it here." />
        ) : (
          <FlatList
            key="kitchens-list"
            data={kitchens ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, gap: 14 }}
            renderItem={({ item, index }) => (
              <KitchenCard
                kitchen={item}
                index={index}
                isFavorited
                onToggleFavorite={() => toggleKitchen.mutate({ id: item.id, isFavorited: true })}
                onPress={() => router.push(`/(customer)/kitchen/${item.id}`)}
              />
            )}
          />
        )
      ) : !foodsLoading && (foods?.length ?? 0) === 0 ? (
        <EmptyState icon={Heart} title="No favorite food yet" message="Tap the heart on any dish to save it here." />
      ) : (
        <FlatList
          key="food-list"
          data={foods ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 20, gap: 14 }}
          renderItem={({ item, index }) => (
            <FoodCard food={item} index={index} onPress={() => router.push(`/(customer)/food/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary-500" : "bg-neutral-100"}`}>
      <Text className={`text-sm font-bold ${active ? "text-white" : "text-neutral-600"}`}>{label}</Text>
    </Pressable>
  );
}
