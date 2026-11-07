import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tokenStorage } from "@/utils/secureStorage";
import type { AuthResponse, User } from "@/types/api";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  setAuth: (auth: AuthResponse) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setAuth: async (auth) => {
        await tokenStorage.setTokens(auth.access_token, auth.refresh_token);
        set({ user: auth.user });
      },
      setUser: (user) => set({ user }),
      logout: async () => {
        await tokenStorage.clearTokens();
        set({ user: null });
      },
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "dastarkhuaan-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
