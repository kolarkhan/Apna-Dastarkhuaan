import { useQuery } from "@tanstack/react-query";

import { kitchensApi, type ListKitchensParams } from "@/services/api/kitchens";
import { queryKeys } from "@/services/queryClient";

export function useKitchens(params: ListKitchensParams) {
  return useQuery({
    queryKey: queryKeys.kitchens.list(params),
    queryFn: () => kitchensApi.list(params),
    enabled: params.lat !== undefined && params.lng !== undefined,
  });
}

export function useKitchen(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.kitchens.detail(id ?? ""),
    queryFn: () => kitchensApi.getById(id as string),
    enabled: !!id,
  });
}

export function useMyKitchen() {
  return useQuery({
    queryKey: queryKeys.kitchens.mine,
    queryFn: kitchensApi.mine,
    retry: false,
  });
}
