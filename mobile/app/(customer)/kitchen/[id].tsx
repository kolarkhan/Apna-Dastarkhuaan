import { useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, Clock, Heart, MapPin } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProBadge, VerifiedBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FoodCard } from "@/components/ui/FoodCard";
import { FullScreenLoading } from "@/components/ui/Loading";
import { Rating } from "@/components/ui/Rating";
import { useFavoriteKitchens, useToggleFavoriteKitchen } from "@/hooks/useFavorites";
import { useFoods } from "@/hooks/useFoods";
import { useKitchen } from "@/hooks/useKitchens";
import { useLocation } from "@/hooks/useLocation";
import { useReviews } from "@/hooks/useReviews";
import { formatDistance, haversineKm } from "@/utils/distance";

const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export default function KitchenDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coords } = useLocation();
  const { data: kitchen, isLoading, isError, refetch } = useKitchen(id);
  const { data: foodsPage } = useFoods({ kitchen_id: id, page_size: 50 });
  const { data: reviewsPage } = useReviews({ kitchen_id: id });
  const { data: favoriteKitchens } = useFavoriteKitchens();
  const toggleFavorite = useToggleFavoriteKitchen();
  const [tab, setTab] = useState<"menu" | "reviews">("menu");

  const isFavorited = favoriteKitchens?.some((k) => k.id === id) ?? false;

  const distanceKm = useMemo(() => {
    if (!coords || !kitchen?.location) return undefined;
    return haversineKm(coords, kitchen.location);
  }, [coords, kitchen?.location]);

  if (isLoading) return <FullScreenLoading />;
  if (isError || !kitchen) return <ErrorState message="Couldn't load this kitchen." onRetry={refetch} />;

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="relative">
          <Image source={{ uri: kitchen.images[0] }} style={{ width: "100%", height: 220 }} contentFit="cover" />
          <SafeAreaView edges={["top"]} className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5 pt-2">
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/90">
              <ArrowLeft size={18} color="#332F2A" />
            </Pressable>
            <Pressable
              onPress={() => toggleFavorite.mutate({ id: kitchen.id, isFavorited })}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
            >
              <Heart size={18} color="#F25C1F" fill={isFavorited ? "#F25C1F" : "transparent"} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View className="px-5 pt-4">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-2xl font-extrabold text-neutral-900">{kitchen.name}</Text>
            {kitchen.subscription_plan === "pro" ? <ProBadge /> : null}
            {kitchen.verified ? <VerifiedBadge /> : null}
          </View>
          <Text className="mt-1 text-sm text-neutral-500">{kitchen.cuisine_tags.join(" · ") || "Home kitchen"}</Text>

          <View className="mt-3 flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <Rating value={kitchen.rating} reviewCount={kitchen.review_count} />
            {distanceKm !== undefined ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color="#8A8177" />
                <Text className="text-xs text-neutral-500">{formatDistance(distanceKm)}</Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-1">
              <Clock size={13} color="#8A8177" />
              <Text className="text-xs text-neutral-500">30-45 min</Text>
            </View>
            <View className={`rounded-full px-2.5 py-1 ${kitchen.is_open ? "bg-success-50" : "bg-danger-50"}`}>
              <Text className={`text-xs font-bold ${kitchen.is_open ? "text-success-700" : "text-danger-700"}`}>
                {kitchen.is_open ? "Open now" : "Closed"}
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-sm leading-5 text-neutral-600">{kitchen.description}</Text>
          <Text className="mt-3 text-xs text-neutral-400">📍 {kitchen.address}</Text>

          {kitchen.business_hours.length > 0 ? (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {kitchen.business_hours.map((bh) => (
                <View key={bh.day} className="rounded-lg bg-neutral-100 px-2.5 py-1.5">
                  <Text className="text-[11px] font-semibold text-neutral-700">
                    {DAY_LABELS[bh.day] ?? bh.day}: {bh.closed ? "Closed" : `${bh.open_time}-${bh.close_time}`}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="mt-6 flex-row gap-2">
            <Pressable onPress={() => setTab("menu")} className={`flex-1 items-center rounded-xl py-2.5 ${tab === "menu" ? "bg-primary-500" : "bg-neutral-100"}`}>
              <Text className={`text-sm font-bold ${tab === "menu" ? "text-white" : "text-neutral-600"}`}>Menu</Text>
            </Pressable>
            <Pressable onPress={() => setTab("reviews")} className={`flex-1 items-center rounded-xl py-2.5 ${tab === "reviews" ? "bg-primary-500" : "bg-neutral-100"}`}>
              <Text className={`text-sm font-bold ${tab === "reviews" ? "text-white" : "text-neutral-600"}`}>
                Reviews ({kitchen.review_count})
              </Text>
            </Pressable>
          </View>
        </View>

        {tab === "menu" ? (
          (foodsPage?.items.length ?? 0) === 0 ? (
            <EmptyState title="No menu items yet" message="This kitchen hasn't added any dishes." />
          ) : (
            <View className="mt-4 flex-row flex-wrap gap-4 px-5">
              {foodsPage?.items.map((food, index) => (
                <FoodCard key={food.id} food={food} index={index} onPress={() => router.push(`/(customer)/food/${food.id}`)} />
              ))}
            </View>
          )
        ) : (reviewsPage?.items.length ?? 0) === 0 ? (
          <EmptyState title="No reviews yet" message="Be the first to review this kitchen after your order." />
        ) : (
          <View className="mt-4 gap-4 px-5">
            {reviewsPage?.items.map((review) => (
              <View key={review.id} className="rounded-2xl bg-neutral-50 p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-neutral-900">{review.customer_name}</Text>
                  <Rating value={review.kitchen_rating} showCount={false} />
                </View>
                {review.comment ? <Text className="mt-1.5 text-sm text-neutral-600">{review.comment}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
