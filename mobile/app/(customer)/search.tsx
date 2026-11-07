import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, SlidersHorizontal } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
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

type Tab = "kitchens" | "food";

export default function SearchScreen() {
  const { categoryId: initialCategoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { coords } = useLocation();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("kitchens");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | undefined>(initialCategoryId);
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<"distance" | "rating">("distance");

  const { data: categories } = useCategories();

  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const kitchensQuery = useKitchens({
    lat: coords?.lat,
    lng: coords?.lng,
    search: debouncedQuery || undefined,
    open_now: openNow || undefined,
    min_rating: minRating,
    sort,
    page_size: 20,
  });

  const foodsQuery = useFoods({
    search: debouncedQuery || undefined,
    category_id: categoryId,
    sort: sort === "rating" ? "rating" : "popular",
    page_size: 20,
  });

  const { data: favoriteKitchens } = useFavoriteKitchens();
  const toggleFavoriteKitchen = useToggleFavoriteKitchen();
  const favoriteKitchenIds = useMemo(() => new Set(favoriteKitchens?.map((k) => k.id)), [favoriteKitchens]);

  const activeFilterCount = [openNow, minRating !== undefined, categoryId !== undefined].filter(Boolean).length;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <View className="flex-1">
          <SearchBar value={query} onChangeText={setQuery} onClear={() => setQuery("")} autoFocus />
        </View>
        <Pressable
          onPress={() => setFiltersOpen(true)}
          className="relative h-11 w-11 items-center justify-center rounded-full bg-neutral-100"
        >
          <SlidersHorizontal size={18} color="#332F2A" />
          {activeFilterCount > 0 ? (
            <View className="absolute -right-0.5 -top-0.5 h-4 w-4 items-center justify-center rounded-full bg-primary-500">
              <Text className="text-[10px] font-bold text-white">{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View className="mt-4 flex-row gap-2 px-5">
        <TabButton label="Kitchens" active={tab === "kitchens"} onPress={() => setTab("kitchens")} />
        <TabButton label="Food" active={tab === "food"} onPress={() => setTab("food")} />
      </View>

      {tab === "kitchens" ? (
        kitchensQuery.isLoading ? (
          <View className="flex-row flex-wrap gap-4 px-5 pt-5">
            {[1, 2, 3, 4].map((i) => <KitchenCardSkeleton key={i} />)}
          </View>
        ) : (kitchensQuery.data?.items.length ?? 0) === 0 ? (
          <EmptyState title="No kitchens found" message="Try a different search term or clear your filters." />
        ) : (
          <FlatList
            key="kitchens-list"
            data={kitchensQuery.data?.items ?? []}
            keyExtractor={(item) => item.id}
            numColumns={1}
            contentContainerStyle={{ padding: 20, gap: 14 }}
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
        )
      ) : foodsQuery.isLoading ? (
        <View className="flex-row flex-wrap gap-4 px-5 pt-5">
          {[1, 2, 3, 4].map((i) => <FoodCardSkeleton key={i} />)}
        </View>
      ) : (foodsQuery.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No food found" message="Try a different search term or clear your filters." />
      ) : (
        <FlatList
          key="food-list"
          data={foodsQuery.data?.items ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 20, gap: 14 }}
          renderItem={({ item, index }) => (
            <FoodCard food={item} index={index} onPress={() => router.push(`/(customer)/food/${item.id}`)} />
          )}
        />
      )}

      <BottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <Text className="mb-4 text-lg font-bold text-neutral-900">Filters</Text>

        <Text className="mb-2 text-sm font-semibold text-neutral-700">Sort by</Text>
        <View className="mb-5 flex-row gap-2">
          <FilterChip label="Nearest" active={sort === "distance"} onPress={() => setSort("distance")} />
          <FilterChip label="Top rated" active={sort === "rating"} onPress={() => setSort("rating")} />
        </View>

        <Text className="mb-2 text-sm font-semibold text-neutral-700">Availability</Text>
        <View className="mb-5 flex-row gap-2">
          <FilterChip label="Open now" active={openNow} onPress={() => setOpenNow((v) => !v)} />
        </View>

        <Text className="mb-2 text-sm font-semibold text-neutral-700">Minimum rating</Text>
        <View className="mb-5 flex-row gap-2">
          {[4, 4.5].map((r) => (
            <FilterChip key={r} label={`${r}+ ⭐`} active={minRating === r} onPress={() => setMinRating(minRating === r ? undefined : r)} />
          ))}
        </View>

        <Text className="mb-2 text-sm font-semibold text-neutral-700">Category</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {(categories ?? []).slice(0, 8).map((c) => (
            <FilterChip
              key={c.id}
              label={`${c.icon ?? ""} ${c.name}`}
              active={categoryId === c.id}
              onPress={() => setCategoryId(categoryId === c.id ? undefined : c.id)}
            />
          ))}
        </View>

        <Button label="Apply Filters" fullWidth onPress={() => setFiltersOpen(false)} />
      </BottomSheet>
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

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`rounded-full border px-3.5 py-2 ${active ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-600" : "text-neutral-600"}`}>{label}</Text>
    </Pressable>
  );
}
