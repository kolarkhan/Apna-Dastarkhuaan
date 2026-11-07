import { ActivityIndicator, View } from "react-native";

export function FullScreenLoading() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#F25C1F" />
    </View>
  );
}

export function InlineLoading() {
  return (
    <View className="items-center justify-center py-6">
      <ActivityIndicator size="small" color="#F25C1F" />
    </View>
  );
}
