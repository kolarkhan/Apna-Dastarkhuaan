import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { StarInput } from "@/components/ui/Rating";
import { useCreateReview } from "@/hooks/useReviews";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";

export default function LeaveReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const createReview = useCreateReview();

  const [foodRating, setFoodRating] = useState(5);
  const [kitchenRating, setKitchenRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [comment, setComment] = useState("");

  const onSubmit = () => {
    createReview.mutate(
      { order_id: orderId, food_rating: foodRating, kitchen_rating: kitchenRating, delivery_rating: deliveryRating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Thanks for your review!");
          router.back();
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't submit your review.")),
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 py-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold text-neutral-900">Rate your order</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color="#332F2A" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-6">
        <RatingRow label="Food quality" value={foodRating} onChange={setFoodRating} />
        <RatingRow label="Kitchen experience" value={kitchenRating} onChange={setKitchenRating} />
        <RatingRow label="Delivery" value={deliveryRating} onChange={setDeliveryRating} />

        <Text className="mb-2 mt-4 text-sm font-semibold text-neutral-700">Add a comment (optional)</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          placeholder="Tell others what you liked..."
          placeholderTextColor="#AFA79B"
          className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-900"
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
      </ScrollView>

      <View className="pt-4">
        <Button label="Submit Review" fullWidth loading={createReview.isPending} onPress={onSubmit} />
      </View>
    </SafeAreaView>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View className="mb-6 items-center gap-3">
      <Text className="text-sm font-semibold text-neutral-700">{label}</Text>
      <StarInput value={value} onChange={onChange} />
    </View>
  );
}
