import type { LucideIcon } from "lucide-react-native";
import { PackageSearch } from "lucide-react-native";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = PackageSearch, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <Icon size={28} color="#AFA79B" />
      </View>
      <Text className="text-center text-base font-bold text-neutral-800">{title}</Text>
      {message ? <Text className="text-center text-sm text-neutral-500">{message}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-2">
          <Button label={actionLabel} variant="outline" size="sm" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
