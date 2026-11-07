import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-primary-500 active:bg-primary-600", text: "text-white" },
  secondary: { container: "bg-secondary-500 active:bg-secondary-600", text: "text-neutral-900" },
  outline: { container: "bg-transparent border border-neutral-300 active:bg-neutral-50", text: "text-neutral-900" },
  ghost: { container: "bg-transparent active:bg-neutral-100", text: "text-primary-600" },
  danger: { container: "bg-danger-500 active:bg-danger-600", text: "text-white" },
};

const SIZE_CLASSES: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-3 py-2 rounded-lg", text: "text-sm" },
  md: { container: "px-5 py-3.5 rounded-xl", text: "text-base" },
  lg: { container: "px-6 py-4 rounded-2xl", text: "text-lg" },
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;
  const v = VARIANT_CLASSES[variant];
  const s = SIZE_CLASSES[size];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={animatedStyle}
      className={`flex-row items-center justify-center gap-2 ${s.container} ${v.container} ${
        fullWidth ? "w-full" : ""
      } ${isDisabled ? "opacity-50" : ""}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#F25C1F"} />
      ) : (
        <>
          {icon}
          <Text className={`font-semibold ${s.text} ${v.text}`}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}
