import { useEffect } from "react";
import { LayoutGrid, ReceiptText, UtensilsCrossed, Wallet } from "lucide-react-native";
import { router, Tabs } from "expo-router";
import { View } from "react-native";

import { FullScreenLoading } from "@/components/ui/Loading";
import { KitchenTabHeader } from "@/components/layout/KitchenTabHeader";
import { colors } from "@/constants/theme";
import { useMyKitchen } from "@/hooks/useKitchens";

export default function KitchenTabsLayout() {
  const { data: kitchen, isLoading, isError } = useMyKitchen();

  useEffect(() => {
    if (!isLoading && isError) {
      router.replace("/(kitchen)/onboarding");
    }
  }, [isLoading, isError]);

  if (isLoading || (isError && !kitchen)) return <FullScreenLoading />;

  return (
    <View style={{ flex: 1 }}>
      <KitchenTabHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: colors.neutral[400],
          tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 8 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} /> }} />
        <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} /> }} />
        <Tabs.Screen name="menu" options={{ title: "Menu", tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size} /> }} />
        <Tabs.Screen name="earnings" options={{ title: "Earnings", tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
