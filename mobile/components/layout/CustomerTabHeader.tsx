import { router, usePathname } from "expo-router";
import { Bell, MapPin } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentUser } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";

const TAB_TITLES: Record<string, string> = {
  orders: "Your Orders",
  favorites: "Favorites",
  profile: "Profile",
};

/**
 * Rendered once by the customer tabs layout, above <Tabs>, so it never
 * unmounts when switching tabs — only its content re-renders per route.
 */
export function CustomerTabHeader() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { coords, refresh: refreshLocation } = useLocation();
  const { data: unread } = useUnreadNotificationCount();

  const activeTab = Object.keys(TAB_TITLES).find((tab) => pathname.endsWith(`/${tab}`));
  const isHome = !activeTab;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <View className="flex-1">
          {isHome ? (
            <>
              <Text className="text-sm text-neutral-500">
                {greeting}, {user?.name.split(" ")[0] ?? "there"} 👋
              </Text>
              <Pressable className="mt-0.5 flex-row items-center gap-1" onPress={refreshLocation}>
                <MapPin size={14} color="#F25C1F" />
                <Text numberOfLines={1} className="text-sm font-semibold text-neutral-900">
                  {coords ? "Current location" : "Set your location"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Text className="text-xl font-bold text-neutral-900">{TAB_TITLES[activeTab]}</Text>
          )}
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push("/(customer)/notifications")}
            className="relative h-11 w-11 items-center justify-center rounded-full bg-neutral-100"
          >
            <Bell size={19} color="#332F2A" />
            {unread && unread.count > 0 ? (
              <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-500" />
            ) : null}
          </Pressable>
          <Pressable onPress={() => router.push("/(customer)/(tabs)/profile")}>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-100">
              <Text className="text-base font-bold text-primary-700">{user?.name.charAt(0) ?? "A"}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
