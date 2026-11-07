import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { ActiveOrderCard } from "@/components/ui/ActiveOrderCard";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoodCard } from "@/components/ui/FoodCard";
import { KitchenCard } from "@/components/ui/KitchenCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { FoodCardSkeleton, KitchenCardSkeleton } from "@/components/ui/Skeleton";
import { useCategories } from "@/hooks/useCategories";
import { useFavoriteKitchens, useToggleFavoriteKitchen } from "@/hooks/useFavorites";
import { useFoods } from "@/hooks/useFoods";
import { useKitchens } from "@/hooks/useKitchens";
import { useLocation } from "@/hooks/useLocation";
import { useActiveOrder } from "@/hooks/useOrders";

export default function HomeScreen() {
  const { coords, refresh: refreshLocation } = useLocation();
  const { data: categories } = useCategories();
  const { data: kitchensPage, isLoading: kitchensLoading, refetch: refetchKitchens } = useKitchens({
    lat: coords?.lat,
    lng: coords?.lng,
    page_size: 8,
  });
  const { data: popularFoods, isLoading: foodsLoading, refetch: refetchFoods } = useFoods({ sort: "popular", page_size: 8 });
  const { data: recommendedFoods, refetch: refetchRecommended } = useFoods({ sort: "rating", page_size: 8 });
  const { data: activeOrder } = useActiveOrder();
  const { data: favoriteKitchens } = useFavoriteKitchens();
  const toggleFavoriteKitchen = useToggleFavoriteKitchen();

  const favoriteKitchenIds = useMemo(() => new Set(favoriteKitchens?.map((k) => k.id)), [favoriteKitchens]);

  const kitchens = kitchensPage?.items ?? [];
  const kitchenNameById = useMemo(() => new Map(kitchens.map((k) => [k.id, k.name])), [kitchens]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={kitchensLoading}
            onRefresh={() => {
              refreshLocation();
              refetchKitchens();
              refetchFoods();
              refetchRecommended();
            }}
          />
        }
      >
        {/* Search */}
        <View className="px-5 pt-5">
          <Pressable onPress={() => router.push("/(customer)/search")}>
            <View pointerEvents="none">
              <SearchBar value="" editable={false} />
            </View>
          </Pressable>
        </View>

        {activeOrder ? <View className="pt-5"><ActiveOrderCard order={activeOrder} /></View> : null}

        {/* Categories */}
        <View className="mt-6">
          <SectionHeader title="Categories" onSeeAll={() => router.push("/(customer)/categories")} />
          <FlatList
            data={categories ?? []}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item }) => (
              <CategoryCard category={item} onPress={() => router.push({ pathname: "/(customer)/search", params: { categoryId: item.id } })} />
            )}
          />
        </View>

        {/* Nearby Kitchens */}
        <View className="mt-7">
          <SectionHeader title="Nearby Kitchens" onSeeAll={() => router.push("/(customer)/search")} />
          {kitchensLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {[1, 2].map((i) => <KitchenCardSkeleton key={i} />)}
            </ScrollView>
          ) : kitchens.length === 0 ? (
            <EmptyState title="No kitchens found nearby." message="Try again shortly or check your location settings." />
          ) : (
            <FlatList
              data={kitchens}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              renderItem={({ item, index }) => (
                <KitchenCard
                  kitchen={item}
                  index={index}
                  isFavorited={favoriteKitchenIds.has(item.id)}
                  onToggleFavorite={() => toggleFavoriteKitchen.mutate({ id: item.id, isFavorited: favoriteKitchenIds.has(item.id) })}
                  onPress={() => router.push(`/(customer)/kitchen/${item.id}`)}
                />
              )}
            />
          )}
        </View>

        {/* Popular Dishes */}
        <View className="mt-7">
          <SectionHeader title="Popular Dishes" onSeeAll={() => router.push("/(customer)/search")} />
          {foodsLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {[1, 2, 3].map((i) => <FoodCardSkeleton key={i} />)}
            </ScrollView>
          ) : (
            <FlatList
              data={popularFoods?.items ?? []}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              renderItem={({ item, index }) => (
                <FoodCard
                  food={item}
                  index={index}
                  kitchenName={kitchenNameById.get(item.kitchen_id)}
                  onPress={() => router.push(`/(customer)/food/${item.id}`)}
                />
              )}
            />
          )}
        </View>

        {/* Recommended */}
        <View className="mt-7">
          <SectionHeader title="Recommended For You" onSeeAll={() => router.push("/(customer)/search")} />
          <FlatList
            data={recommendedFoods?.items ?? []}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item, index }) => (
              <FoodCard
                food={item}
                index={index}
                kitchenName={kitchenNameById.get(item.kitchen_id)}
                onPress={() => router.push(`/(customer)/food/${item.id}`)}
              />
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between px-5">
      <Text className="text-lg font-bold text-neutral-900">{title}</Text>
      <Pressable onPress={onSeeAll}>
        <Text className="text-sm font-semibold text-primary-600">See all</Text>
      </Pressable>
    </View>
  );
}
