import { router, usePathname } from "expo-router";
import { Bell, Crown, Plus, Star } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProBadge } from "@/components/ui/Badge";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMyKitchen } from "@/hooks/useKitchens";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";

const TAB_TITLES: Record<string, string> = {
  orders: "Orders",
  menu: "Your Menu",
  earnings: "Earnings",
  profile: "Profile",
};

/**
 * Rendered once by the kitchen tabs layout, above <Tabs>, so it never
 * unmounts when switching tabs — only its content re-renders per route.
 */
export function KitchenTabHeader() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { data: kitchen } = useMyKitchen();
  const { data: unread } = useUnreadNotificationCount();

  const activeTab = Object.keys(TAB_TITLES).find((tab) => pathname.endsWith(`/${tab}`));
  const isDashboard = !activeTab;

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <View className="flex-1">
          {isDashboard ? (
            <>
              <Text className="text-sm text-neutral-500">Welcome back,</Text>
              <Text className="text-lg font-bold text-neutral-900">{user?.name.split(" ")[0]}</Text>
            </>
          ) : (
            <Text className="text-xl font-bold text-neutral-900">{TAB_TITLES[activeTab]}</Text>
          )}
        </View>
        <View className="flex-row items-center gap-2.5">
          {kitchen ? (
            kitchen.subscription_plan === "pro" ? (
              <ProBadge />
            ) : (
              <Pressable
                onPress={() => router.push("/(kitchen)/subscription")}
                className="flex-row items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1.5"
              >
                <Crown size={12} color="#F25C1F" />
                <Text className="text-xs font-semibold text-primary-700">Upgrade to Pro</Text>
              </Pressable>
            )
          ) : null}
          {activeTab === "menu" ? (
            <Pressable
              onPress={() => router.push("/(kitchen)/menu/add")}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-500"
            >
              <Plus size={18} color="#fff" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push("/(kitchen)/notifications")}
            className="relative h-11 w-11 items-center justify-center rounded-full bg-neutral-100"
          >
            <Bell size={19} color="#332F2A" />
            {unread && unread.count > 0 ? (
              <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-500" />
            ) : null}
          </Pressable>
          <Pressable onPress={() => router.push("/(kitchen)/(tabs)/profile")} className="relative">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary-100">
              <Text className="text-base font-bold text-secondary-700">{user?.name.charAt(0) ?? "K"}</Text>
            </View>
            {kitchen && kitchen.rating > 0 ? (
              <View className="absolute -bottom-1 w-11 items-center">
                <View className="flex-row items-center gap-0.5 rounded-full border border-white bg-neutral-900 px-1 py-[1px]">
                  <Star size={6} color="#E6A817" fill="#E6A817" />
                  <Text className="text-[8px] font-bold text-white">{kitchen.rating.toFixed(1)}</Text>
                </View>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
