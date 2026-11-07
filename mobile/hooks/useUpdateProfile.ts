import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usersApi } from "@/services/api/users";
import { useAuthStore } from "@/store/authStore";
import { queryKeys } from "@/services/queryClient";
import type { NotificationPreferences } from "@/types/api";

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: usersApi.changePassword });
}

export function useUpdateNotificationPreferences() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotificationPreferences) => usersApi.updateNotificationPreferences(prefs),
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: (password: string) => usersApi.deleteAccount(password) });
}
