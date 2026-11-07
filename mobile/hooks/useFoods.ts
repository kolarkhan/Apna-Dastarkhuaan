import { useQuery } from "@tanstack/react-query";

import { foodsApi, type ListFoodsParams } from "@/services/api/foods";
import { queryKeys } from "@/services/queryClient";

export function useFoods(params: ListFoodsParams) {
  return useQuery({
    queryKey: queryKeys.foods.list(params),
    queryFn: () => foodsApi.list(params),
  });
}

export function useFood(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.foods.detail(id ?? ""),
    queryFn: () => foodsApi.getById(id as string),
    enabled: !!id,
  });
}
