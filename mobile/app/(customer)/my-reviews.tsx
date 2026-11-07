import { router } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { useMyReviews } from "@/hooks/useReviews";

export default function MyReviewsScreen() {
  const { data: reviews, isLoading } = useMyReviews();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">My Reviews</Text>
      </View>

      {!isLoading && (reviews?.length ?? 0) === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" message="Reviews you leave after delivery will show up here." />
      ) : (
        <FlatList
          data={reviews ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <View className="rounded-2xl bg-neutral-50 p-4">
              <View className="flex-row items-center justify-between">
                <Rating value={(item.food_rating + item.kitchen_rating + item.delivery_rating) / 3} showCount={false} />
                <Text className="text-xs text-neutral-400">{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              {item.comment ? <Text className="mt-1.5 text-sm text-neutral-600">{item.comment}</Text> : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
