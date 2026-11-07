import { useQuery } from "@tanstack/react-query";

import { categoriesApi } from "@/services/api/categories";
import { queryKeys } from "@/services/queryClient";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: categoriesApi.list,
    staleTime: 5 * 60_000,
  });
}
