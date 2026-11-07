import { TriangleAlert } from "lucide-react-native";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong. Please try again.", onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-danger-50">
        <TriangleAlert size={28} color="#EF4444" />
      </View>
      <Text className="text-center text-base font-bold text-neutral-800">Oops!</Text>
      <Text className="text-center text-sm text-neutral-500">{message}</Text>
      {onRetry ? (
        <View className="mt-2">
          <Button label="Try again" variant="primary" size="sm" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
