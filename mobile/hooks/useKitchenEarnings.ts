import { useQuery } from "@tanstack/react-query";

import { kitchenEarningsApi } from "@/services/api/kitchenEarnings";
import { queryKeys } from "@/services/queryClient";

export function useKitchenEarningsSummary() {
  return useQuery({
    queryKey: queryKeys.kitchenEarnings.summary,
    queryFn: kitchenEarningsApi.summary,
    refetchInterval: 30_000,
  });
}

export function useKitchenEarningsHistory(page = 1) {
  return useQuery({
    queryKey: queryKeys.kitchenEarnings.history({ page }),
    queryFn: () => kitchenEarningsApi.history({ page }),
  });
}
