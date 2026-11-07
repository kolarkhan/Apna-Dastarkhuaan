import { router } from "expo-router";
import { ChevronRight, Heart, MapPin, Settings, Star, User } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentUser } from "@/hooks/useAuth";

const MENU_ITEMS: { icon: typeof Settings; label: string; route: string }[] = [
  { icon: User, label: "Profile", route: "/(customer)/edit-profile" },
  { icon: MapPin, label: "My Addresses", route: "/(customer)/addresses" },
  { icon: Heart, label: "Favorites", route: "/(customer)/(tabs)/favorites" },
  { icon: Star, label: "My Reviews", route: "/(customer)/my-reviews" },
  { icon: Settings, label: "Settings", route: "/(customer)/settings" },
];

export default function ProfileScreen() {
  const user = useCurrentUser();

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <View className="items-center gap-2 px-5 pt-4">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <Text className="text-3xl font-extrabold text-primary-700">{user?.name.charAt(0) ?? "A"}</Text>
        </View>
        <Text className="text-lg font-bold text-neutral-900">{user?.name}</Text>
        <Text className="text-sm text-neutral-500">{user?.email}</Text>
      </View>

      <View className="mt-8 gap-1 px-5">
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as never)}
            className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-neutral-50"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <item.icon size={18} color="#332F2A" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-neutral-800">{item.label}</Text>
            <ChevronRight size={18} color="#AFA79B" />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
