import { useRef, useState } from "react";
import { router } from "expo-router";
import { Dimensions, FlatList, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

import { Button } from "@/components/ui/Button";
import { brand } from "@/constants/theme";
import { useUiStore } from "@/store/uiStore";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🍲",
    title: "Real homemade desi food",
    description: "Discover home kitchens near you cooking fresh, authentic meals — just like ghar ka khana.",
  },
  {
    emoji: "✅",
    title: "Verified, trusted kitchens",
    description: "Every kitchen is reviewed before going live, so you always know who's cooking your food.",
  },
  {
    emoji: "🛵",
    title: "Track your order live",
    description: "Follow your order from the kitchen to your doorstep, every step of the way.",
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const setSeenOnboarding = useUiStore((s) => s.setSeenOnboarding);

  const finish = () => {
    setSeenOnboarding();
    router.replace("/(auth)/choose-role");
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={{ width }} className="flex-1 items-center justify-center px-10">
              <Animated.Text entering={FadeIn.duration(400)} style={{ fontSize: 88 }}>
                {item.emoji}
              </Animated.Text>
              <Animated.View entering={FadeIn.delay(100).duration(400)}>
                <Text className="mt-8 text-center text-2xl font-extrabold text-neutral-900">{item.title}</Text>
                <Text className="mt-3 text-center text-base text-neutral-500">{item.description}</Text>
              </Animated.View>
            </View>
          )}
        />

        <View className="flex-row items-center justify-center gap-2 py-4">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === activeIndex ? "w-6 bg-primary-500" : "w-2 bg-neutral-200"}`}
            />
          ))}
        </View>
      </View>

      <View className="gap-3 px-6 pb-4">
        <Text className="text-center text-xs font-medium text-neutral-400">{brand.tagline}</Text>
        <Button label={isLast ? "Get Started" : "Next"} fullWidth onPress={() => {
          if (isLast) {
            finish();
          } else {
            listRef.current?.scrollToIndex({ index: activeIndex + 1 });
          }
        }} />
        {!isLast ? <Button label="Skip" variant="ghost" fullWidth onPress={finish} /> : null}
      </View>
    </SafeAreaView>
  );
}
