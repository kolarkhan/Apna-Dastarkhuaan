import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reviewsApi, type CreateReviewPayload } from "@/services/api/reviews";
import { queryKeys } from "@/services/queryClient";

export function useReviews(params: { kitchen_id?: string; food_id?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.list(params),
    queryFn: () => reviewsApi.list(params),
    enabled: !!(params.kitchen_id || params.food_id),
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: queryKeys.reviews.mine,
    queryFn: reviewsApi.mine,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.mine });
      queryClient.invalidateQueries({ queryKey: ["reviews", "list"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.order_id) });
    },
  });
}
