import { Text, View } from "react-native";

interface PriceRowProps {
  label: string;
  value: number;
  emphasis?: boolean;
  negative?: boolean;
}

export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function PriceRow({ label, value, emphasis = false, negative = false }: PriceRowProps) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className={emphasis ? "text-base font-bold text-neutral-900" : "text-sm text-neutral-600"}>{label}</Text>
      <Text
        className={
          emphasis
            ? "text-base font-bold text-neutral-900"
            : negative
              ? "text-sm font-semibold text-success-600"
              : "text-sm font-medium text-neutral-800"
        }
      >
        {negative && value > 0 ? "-" : ""}
        {formatPKR(value)}
      </Text>
    </View>
  );
}
