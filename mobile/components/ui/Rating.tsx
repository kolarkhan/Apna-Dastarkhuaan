import { Star } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface RatingProps {
  value: number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
}

export function Rating({ value, reviewCount, size = 13, showCount = true }: RatingProps) {
  return (
    <View className="flex-row items-center gap-1">
      <Star size={size} color="#E6A817" fill="#E6A817" />
      <Text className="text-xs font-semibold text-neutral-800">{value > 0 ? value.toFixed(1) : "New"}</Text>
      {showCount && reviewCount !== undefined && reviewCount > 0 ? (
        <Text className="text-xs text-neutral-500">({reviewCount})</Text>
      ) : null}
    </View>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export function StarInput({ value, onChange, size = 32 }: StarInputProps) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={4}>
          <Star size={size} color="#E6A817" fill={star <= value ? "#E6A817" : "transparent"} />
        </Pressable>
      ))}
    </View>
  );
}
