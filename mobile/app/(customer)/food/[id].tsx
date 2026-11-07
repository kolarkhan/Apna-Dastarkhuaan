import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { Heart, X } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { FullScreenLoading } from "@/components/ui/Loading";
import { formatPKR, PriceRow } from "@/components/ui/PriceRow";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Rating } from "@/components/ui/Rating";
import { useFavoriteFoods, useToggleFavoriteFood } from "@/hooks/useFavorites";
import { useFood } from "@/hooks/useFoods";
import { useKitchen } from "@/hooks/useKitchens";

export default function FoodDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: food, isLoading, isError, refetch } = useFood(id);
  const { data: kitchen } = useKitchen(food?.kitchen_id);
  const { data: favoriteFoods } = useFavoriteFoods();
  const toggleFavoriteFood = useToggleFavoriteFood();
  const isFavorited = favoriteFoods?.some((f) => f.id === id) ?? false;

  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);

  const toggleCustomization = (name: string) => {
    setSelectedCustomizations((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  };

  const onOrderNow = () => {
    if (!food) return;
    router.push({
      pathname: "/(customer)/checkout",
      params: { foodId: food.id, quantity: String(quantity), customizations: JSON.stringify(selectedCustomizations) },
    });
  };

  if (isLoading) return <FullScreenLoading />;
  if (isError || !food) return <ErrorState message="Couldn't load this dish." onRetry={refetch} />;

  const extraTotal = selectedCustomizations.reduce((sum, name) => {
    const opt = food.customization_options.find((o) => o.name === name);
    return sum + (opt?.price_delta ?? 0);
  }, 0);
  const total = (food.price + extraTotal) * quantity;

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="relative">
          <Image source={{ uri: food.images[0] }} style={{ width: "100%", height: 260 }} contentFit="cover" />
          <SafeAreaView edges={["top"]} className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5 pt-2">
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/90">
              <X size={18} color="#332F2A" />
            </Pressable>
            <Pressable
              onPress={() => toggleFavoriteFood.mutate({ id: food.id, isFavorited })}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
            >
              <Heart size={18} color="#F25C1F" fill={isFavorited ? "#F25C1F" : "transparent"} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View className="px-5 pt-5">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-2xl font-extrabold text-neutral-900">{food.name}</Text>
            <Text className="text-xl font-extrabold text-primary-600">{formatPKR(food.price)}</Text>
          </View>
          {kitchen ? (
            <Pressable onPress={() => router.push(`/(customer)/kitchen/${kitchen.id}`)}>
              <Text className="mt-1 text-sm font-semibold text-neutral-500">by {kitchen.name}</Text>
            </Pressable>
          ) : null}

          <View className="mt-3 flex-row items-center gap-3">
            <Rating value={food.rating} reviewCount={food.review_count} />
            <Badge label={food.spice_level} tone={food.spice_level === "spicy" ? "danger" : food.spice_level === "medium" ? "warning" : "neutral"} />
            <Badge label={`${food.preparation_time_minutes} min`} tone="neutral" />
          </View>

          <Text className="mt-4 text-sm leading-5 text-neutral-600">{food.description}</Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {food.ingredients.map((ing) => (
              <View key={ing} className="rounded-lg bg-neutral-100 px-2.5 py-1">
                <Text className="text-xs text-neutral-600">{ing}</Text>
              </View>
            ))}
          </View>

          <Text className="mt-2 text-xs text-neutral-400">Portion: {food.portion}</Text>

          {food.customization_options.length > 0 ? (
            <View className="mt-6">
              <Text className="mb-3 text-base font-bold text-neutral-900">Customize your order</Text>
              <View className="gap-2.5">
                {food.customization_options.map((opt) => {
                  const selected = selectedCustomizations.includes(opt.name);
                  return (
                    <Pressable
                      key={opt.name}
                      onPress={() => toggleCustomization(opt.name)}
                      className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${selected ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}
                    >
                      <Text className={`text-sm font-medium ${selected ? "text-primary-700" : "text-neutral-700"}`}>{opt.name}</Text>
                      {opt.price_delta > 0 ? (
                        <Text className="text-xs font-semibold text-neutral-500">+{formatPKR(opt.price_delta)}</Text>
                      ) : (
                        <View className={`h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary-500 bg-primary-500" : "border-neutral-300"}`}>
                          {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 gap-3 border-t border-neutral-100 bg-white px-5 pb-8 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-neutral-600">Quantity</Text>
          <QuantitySelector value={quantity} onChange={setQuantity} />
        </View>
        {!food.available ? (
          <Text className="text-center text-sm font-semibold text-danger-600">This item is currently sold out</Text>
        ) : null}
        <Button label={`Order Now · ${formatPKR(total)}`} fullWidth disabled={!food.available} onPress={onOrderNow} />
      </View>
    </View>
  );
}
