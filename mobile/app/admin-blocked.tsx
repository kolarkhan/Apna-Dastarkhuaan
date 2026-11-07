import { ShieldAlert } from "lucide-react-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { useLogout } from "@/hooks/useAuth";

export default function AdminBlockedScreen() {
  const logout = useLogout();

  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-white px-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50">
        <ShieldAlert size={28} color="#F25C1F" />
      </View>
      <Text className="text-center text-xl font-bold text-neutral-900">Admin accounts use the web dashboard</Text>
      <Text className="text-center text-sm text-neutral-500">
        Please sign in from the Apna Dastarkhuaan admin panel on the web to manage the platform.
      </Text>
      <Button label="Log out" variant="outline" onPress={() => logout.mutate()} />
    </SafeAreaView>
  );
}
