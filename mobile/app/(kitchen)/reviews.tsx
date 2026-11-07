import { router } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { useMyKitchen } from "@/hooks/useKitchens";
import { useReviews } from "@/hooks/useReviews";

export default function KitchenReviewsScreen() {
  const { data: kitchen } = useMyKitchen();
  const { data: reviewsPage, isLoading } = useReviews({ kitchen_id: kitchen?.id });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <View>
          <Text className="text-xl font-bold text-neutral-900">Reviews</Text>
          {kitchen ? <Rating value={kitchen.rating} reviewCount={kitchen.review_count} /> : null}
        </View>
      </View>

      {!isLoading && (reviewsPage?.items.length ?? 0) === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" message="Customer reviews will show up here after delivered orders." />
      ) : (
        <FlatList
          data={reviewsPage?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <View className="rounded-2xl bg-neutral-50 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-neutral-900">{item.customer_name}</Text>
                <Rating value={item.kitchen_rating} showCount={false} />
              </View>
              {item.comment ? <Text className="mt-1.5 text-sm text-neutral-600">{item.comment}</Text> : null}
              <Text className="mt-1.5 text-xs text-neutral-400">{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
