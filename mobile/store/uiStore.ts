import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UiState {
  hasSeenOnboarding: boolean;
  selectedAddressId: string | null;
  lastKnownLocation: { lat: number; lng: number } | null;
  setSeenOnboarding: () => void;
  setSelectedAddressId: (id: string | null) => void;
  setLastKnownLocation: (loc: { lat: number; lng: number } | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      selectedAddressId: null,
      lastKnownLocation: null,
      setSeenOnboarding: () => set({ hasSeenOnboarding: true }),
      setSelectedAddressId: (id) => set({ selectedAddressId: id }),
      setLastKnownLocation: (loc) => set({ lastKnownLocation: loc }),
    }),
    {
      name: "dastarkhuaan-ui",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
