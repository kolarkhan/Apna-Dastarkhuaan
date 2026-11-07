import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { formatPKR } from "@/components/ui/PriceRow";
import { Rating } from "@/components/ui/Rating";
import type { FoodItem } from "@/types/api";

interface FoodCardProps {
  food: FoodItem;
  kitchenName?: string;
  onPress: () => void;
  onAdd?: () => void;
  index?: number;
}

export function FoodCard({ food, kitchenName, onPress, onAdd, index = 0 }: FoodCardProps) {
  return (
    <Animated.View entering={FadeIn.delay(Math.min(index, 6) * 40).duration(280)}>
      <Pressable
        onPress={onPress}
        className="w-44 overflow-hidden rounded-2xl bg-white active:opacity-90"
        style={{ shadowColor: "#1F1C19", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}
      >
        <View className="relative">
          <Image source={{ uri: food.images[0] }} style={{ width: "100%", height: 110 }} contentFit="cover" transition={200} />
          {!food.available ? (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <Text className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-900">Sold out</Text>
            </View>
          ) : onAdd ? (
            <Pressable
              onPress={onAdd}
              hitSlop={8}
              className="absolute bottom-2 right-2 h-8 w-8 items-center justify-center rounded-full bg-primary-500"
              style={{ shadowColor: "#F25C1F", shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 }}
            >
              <Plus size={16} color="#fff" />
            </Pressable>
          ) : null}
        </View>

        <View className="gap-1 p-2.5">
          <Text numberOfLines={1} className="text-sm font-bold text-neutral-900">
            {food.name}
          </Text>
          {kitchenName ? (
            <Text numberOfLines={1} className="text-[11px] text-neutral-500">
              {kitchenName}
            </Text>
          ) : null}
          <View className="mt-0.5 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-primary-600">{formatPKR(food.price)}</Text>
            <Rating value={food.rating} showCount={false} size={11} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
