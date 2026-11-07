import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryCard } from "@/components/ui/CategoryCard";
import { useCategories } from "@/hooks/useCategories";

export default function CategoriesScreen() {
  const { data: categories, isLoading } = useCategories();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">All Categories</Text>
      </View>

      <FlatList
        data={categories ?? []}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={{ padding: 20, gap: 20 }}
        columnWrapperStyle={{ gap: 12 }}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <CategoryCard category={item} onPress={() => router.push({ pathname: "/(customer)/search", params: { categoryId: item.id } })} />
        )}
      />
    </SafeAreaView>
  );
}
