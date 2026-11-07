import { Pressable, Text, View } from "react-native";

import type { Category } from "@/types/api";

interface CategoryCardProps {
  category: Category;
  selected?: boolean;
  onPress: () => void;
}

export function CategoryCard({ category, selected = false, onPress }: CategoryCardProps) {
  return (
    <Pressable onPress={onPress} className="items-center gap-1.5" style={{ width: 68 }}>
      <View
        className={`h-16 w-16 items-center justify-center rounded-2xl ${
          selected ? "bg-primary-500" : "bg-primary-50"
        }`}
      >
        <Text style={{ fontSize: 26 }}>{category.icon ?? "🍽️"}</Text>
      </View>
      <Text
        numberOfLines={1}
        className={`text-center text-xs font-semibold ${selected ? "text-primary-600" : "text-neutral-700"}`}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}
