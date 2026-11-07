import { ChefHat, UtensilsCrossed } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Link, router } from "expo-router";

import { brand } from "@/constants/theme";

export default function ChooseRoleScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="flex-1 items-center justify-center gap-1">
        <Text className="text-3xl font-extrabold text-primary-600">{brand.name}</Text>
        <Text className="text-center text-sm text-neutral-500">{brand.tagline}</Text>
      </View>

      <View className="gap-4 pb-6">
        <Text className="text-center text-base font-semibold text-neutral-700">How would you like to join?</Text>

        <Animated.View entering={FadeInUp.delay(80).duration(300)}>
          <Pressable
            onPress={() => router.push({ pathname: "/(auth)/register", params: { role: "customer" } })}
            className="flex-row items-center gap-4 rounded-2xl border border-neutral-200 p-4 active:bg-neutral-50"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <UtensilsCrossed size={26} color="#F25C1F" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-neutral-900">I want to order food</Text>
              <Text className="text-xs text-neutral-500">Discover and order from home kitchens near you</Text>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(300)}>
          <Pressable
            onPress={() => router.push({ pathname: "/(auth)/register", params: { role: "kitchen_owner" } })}
            className="flex-row items-center gap-4 rounded-2xl border border-neutral-200 p-4 active:bg-neutral-50"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100">
              <ChefHat size={26} color="#C8850F" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-neutral-900">I want to sell food</Text>
              <Text className="text-xs text-neutral-500">Start your own home kitchen and reach customers</Text>
            </View>
          </Pressable>
        </Animated.View>

        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          <Text className="text-sm text-neutral-500">Already have an account?</Text>
          <Link href="/(auth)/login" className="text-sm font-bold text-primary-600">
            Log in
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
