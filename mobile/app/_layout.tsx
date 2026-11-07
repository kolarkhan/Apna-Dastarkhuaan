import { useEffect } from "react";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastHost } from "@/components/ui/Toast";
import { queryClient } from "@/services/queryClient";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";

import "@/global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const hasSeenOnboarding = useUiStore((s) => s.hasSeenOnboarding);

  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!user && !hasSeenOnboarding}>
              <Stack.Screen name="onboarding" />
            </Stack.Protected>

            <Stack.Protected guard={!user && hasSeenOnboarding}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>

            <Stack.Protected guard={!!user && user.role === "customer"}>
              <Stack.Screen name="(customer)" />
            </Stack.Protected>

            <Stack.Protected guard={!!user && user.role === "kitchen_owner"}>
              <Stack.Screen name="(kitchen)" />
            </Stack.Protected>

            <Stack.Protected guard={!!user && user.role === "admin"}>
              <Stack.Screen name="admin-blocked" />
            </Stack.Protected>
          </Stack>
          <ToastHost />
          <StatusBar style="dark" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
