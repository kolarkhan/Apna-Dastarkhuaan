import * as Haptics from "expo-haptics";
import { Minus, Plus } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export function QuantitySelector({ value, onChange, min = 1, max = 20, size = "md" }: QuantitySelectorProps) {
  const dim = size === "sm" ? 28 : 36;
  const iconSize = size === "sm" ? 14 : 16;

  const decrement = () => {
    if (value <= min) return;
    Haptics.selectionAsync();
    onChange(value - 1);
  };

  const increment = () => {
    if (value >= max) return;
    Haptics.selectionAsync();
    onChange(value + 1);
  };

  return (
    <View className="flex-row items-center gap-3 rounded-full bg-neutral-100 px-1 py-1">
      <Pressable
        onPress={decrement}
        disabled={value <= min}
        accessibilityLabel="Decrease quantity"
        style={{ width: dim, height: dim }}
        className={`items-center justify-center rounded-full bg-white ${value <= min ? "opacity-40" : ""}`}
      >
        <Minus size={iconSize} color="#332F2A" />
      </Pressable>
      <Text className="min-w-[20px] text-center text-base font-bold text-neutral-900">{value}</Text>
      <Pressable
        onPress={increment}
        disabled={value >= max}
        accessibilityLabel="Increase quantity"
        style={{ width: dim, height: dim }}
        className={`items-center justify-center rounded-full bg-primary-500 ${value >= max ? "opacity-40" : ""}`}
      >
        <Plus size={iconSize} color="#fff" />
      </Pressable>
    </View>
  );
}
