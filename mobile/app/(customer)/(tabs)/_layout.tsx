import { Heart, Home, ReceiptText, User } from "lucide-react-native";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { CustomerTabHeader } from "@/components/layout/CustomerTabHeader";
import { colors } from "@/constants/theme";

export default function CustomerTabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <CustomerTabHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: colors.neutral[400],
          tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 8 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="orders"
          options={{ title: "Orders", tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="favorites"
          options={{ title: "Favorites", tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
        />
      </Tabs>
    </View>
  );
}
