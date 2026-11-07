import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  className?: string;
}

export function Skeleton({ width = "100%", height = 16, radius = 8, className }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`bg-neutral-200 ${className ?? ""}`}
      style={[{ width, height, borderRadius: radius }, style]}
    />
  );
}

export function KitchenCardSkeleton() {
  return (
    <View className="w-72 gap-2 overflow-hidden rounded-2xl bg-white p-0">
      <Skeleton width="100%" height={140} radius={0} />
      <View className="gap-2 p-3">
        <Skeleton width="70%" height={16} />
        <Skeleton width="45%" height={12} />
        <Skeleton width="90%" height={12} />
      </View>
    </View>
  );
}

export function FoodCardSkeleton() {
  return (
    <View className="w-44 gap-2 overflow-hidden rounded-2xl bg-white">
      <Skeleton width="100%" height={110} radius={0} />
      <View className="gap-2 p-2.5">
        <Skeleton width="80%" height={14} />
        <Skeleton width="50%" height={12} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  );
}

export function ListRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Skeleton width={56} height={56} radius={12} />
      <View className="flex-1 gap-2">
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}
