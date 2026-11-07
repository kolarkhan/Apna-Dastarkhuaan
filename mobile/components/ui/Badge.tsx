import { Text, View } from "react-native";
import { BadgeCheck, Crown } from "lucide-react-native";

type BadgeTone = "primary" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: "bg-primary-50 text-primary-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  neutral: "bg-neutral-100 text-neutral-700",
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const classes = TONE_CLASSES[tone].split(" ");
  return (
    <View className={`rounded-full px-2.5 py-1 ${classes[0]}`}>
      <Text className={`text-xs font-semibold ${classes[1]}`}>{label}</Text>
    </View>
  );
}

export function VerifiedBadge() {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-success-50 px-2.5 py-1">
      <BadgeCheck size={13} color="#178A48" />
      <Text className="text-xs font-semibold text-success-700">Verified</Text>
    </View>
  );
}

export function ProBadge() {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1">
      <Crown size={12} color="#FDBA92" />
      <Text className="text-xs font-semibold text-primary-200">Pro</Text>
    </View>
  );
}
