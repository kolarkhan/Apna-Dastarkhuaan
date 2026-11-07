import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { favoritesApi } from "@/services/api/favorites";
import { queryKeys } from "@/services/queryClient";

export function useFavoriteKitchens() {
  return useQuery({ queryKey: queryKeys.favorites.kitchens, queryFn: favoritesApi.kitchens });
}

export function useFavoriteFoods() {
  return useQuery({ queryKey: queryKeys.favorites.foods, queryFn: favoritesApi.foods });
}

export function useToggleFavoriteKitchen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorited }: { id: string; isFavorited: boolean }) =>
      isFavorited ? favoritesApi.unfavoriteKitchen(id) : favoritesApi.favoriteKitchen(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites.kitchens }),
  });
}

export function useToggleFavoriteFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorited }: { id: string; isFavorited: boolean }) =>
      isFavorited ? favoritesApi.unfavoriteFood(id) : favoritesApi.favoriteFood(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites.foods }),
  });
}
