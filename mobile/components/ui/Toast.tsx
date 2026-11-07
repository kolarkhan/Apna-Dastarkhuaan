import { useEffect } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react-native";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { useToastStore } from "@/store/toastStore";

const TONE_CONFIG = {
  success: { bg: "bg-success-600", Icon: CheckCircle2 },
  error: { bg: "bg-danger-600", Icon: XCircle },
  info: { bg: "bg-neutral-900", Icon: Info },
} as const;

export function ToastHost() {
  const { message, tone, hide } = useToastStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 2600);
    return () => clearTimeout(timer);
  }, [message, hide]);

  if (!message) return null;

  const { bg, Icon } = TONE_CONFIG[tone];

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      className={`absolute left-4 right-4 flex-row items-center gap-2.5 rounded-2xl px-4 py-3.5 ${bg}`}
      style={{ top: insets.top + 8, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 8, zIndex: 999 }}
    >
      <Icon size={18} color="#fff" />
      <Text className="flex-1 text-sm font-semibold text-white">{message}</Text>
    </Animated.View>
  );
}
