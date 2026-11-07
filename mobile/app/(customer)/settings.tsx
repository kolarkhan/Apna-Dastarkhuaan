import { useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, LogOut } from "lucide-react-native";
import { ScrollView, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { NotificationPreferencesSection } from "@/components/settings/NotificationPreferencesSection";
import { ConfirmModal } from "@/components/ui/Modal";
import { useLogout } from "@/hooks/useAuth";

export default function SettingsScreen() {
  const logout = useLogout();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Settings</Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="mb-1 text-sm font-bold text-neutral-900">Notifications</Text>
        <NotificationPreferencesSection />

        <View className="my-6 h-px bg-neutral-100" />

        <Pressable
          onPress={() => setLogoutModalVisible(true)}
          className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-danger-50"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-danger-50">
            <LogOut size={18} color="#DC2626" />
          </View>
          <Text className="flex-1 text-sm font-semibold text-danger-600">Log Out</Text>
        </Pressable>

        <DeleteAccountSection warningMessage="This permanently closes your account. Your past orders and reviews stay on record, but you'll need to create a new account to order again." />
      </ScrollView>

      <ConfirmModal
        visible={logoutModalVisible}
        title="Log out?"
        message="You'll need to log in again to place new orders."
        confirmLabel="Log Out"
        destructive
        onConfirm={() => {
          setLogoutModalVisible(false);
          logout.mutate();
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </SafeAreaView>
  );
}
