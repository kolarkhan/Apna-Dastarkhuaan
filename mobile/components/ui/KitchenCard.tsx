import { Image } from "expo-image";
import { Clock, Heart } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Rating } from "@/components/ui/Rating";
import { ProBadge, VerifiedBadge } from "@/components/ui/Badge";
import { formatDistance } from "@/utils/distance";
import type { Kitchen } from "@/types/api";

interface KitchenCardProps {
  kitchen: Kitchen;
  onPress: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  index?: number;
}

export function KitchenCard({ kitchen, onPress, isFavorited, onToggleFavorite, index = 0 }: KitchenCardProps) {
  return (
    <Animated.View entering={FadeIn.delay(Math.min(index, 6) * 40).duration(280)}>
      <Pressable
        onPress={onPress}
        className="w-72 overflow-hidden rounded-2xl bg-white active:opacity-90"
        style={{ shadowColor: "#1F1C19", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}
      >
        <View className="relative">
          <Image
            source={{ uri: kitchen.images[0] }}
            style={{ width: "100%", height: 140 }}
            contentFit="cover"
            transition={200}
          />
          {!kitchen.is_open ? (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <Text className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-900">Closed</Text>
            </View>
          ) : null}
          {onToggleFavorite ? (
            <Pressable
              onPress={onToggleFavorite}
              hitSlop={8}
              className="absolute right-2.5 top-2.5 h-8 w-8 items-center justify-center rounded-full bg-white/95"
            >
              <Heart size={16} color="#F25C1F" fill={isFavorited ? "#F25C1F" : "transparent"} />
            </Pressable>
          ) : null}
        </View>

        <View className="gap-1 p-3">
          <View className="flex-row items-center gap-1.5">
            <Text numberOfLines={1} className="flex-1 text-base font-bold text-neutral-900">
              {kitchen.name}
            </Text>
            {kitchen.subscription_plan === "pro" ? <ProBadge /> : null}
            {kitchen.verified ? <VerifiedBadge /> : null}
          </View>

          <Text numberOfLines={1} className="text-xs text-neutral-500">
            {kitchen.cuisine_tags.join(" · ") || "Home kitchen"}
          </Text>

          <View className="mt-1 flex-row items-center justify-between">
            <Rating value={kitchen.rating} reviewCount={kitchen.review_count} />
            <View className="flex-row items-center gap-3">
              {kitchen.distance_km !== undefined ? (
                <Text className="text-xs text-neutral-500">{formatDistance(kitchen.distance_km)}</Text>
              ) : null}
              <View className="flex-row items-center gap-1">
                <Clock size={12} color="#8A8177" />
                <Text className="text-xs text-neutral-500">30-45 min</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
