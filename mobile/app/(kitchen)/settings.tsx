import { useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, LogOut } from "lucide-react-native";
import { ScrollView, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { NotificationPreferencesSection } from "@/components/settings/NotificationPreferencesSection";
import { ConfirmModal } from "@/components/ui/Modal";
import { useLogout } from "@/hooks/useAuth";
import { useMyKitchen } from "@/hooks/useKitchens";
import { getApiErrorMessage } from "@/services/api/client";
import { kitchensApi } from "@/services/api/kitchens";
import { queryKeys } from "@/services/queryClient";
import { toast } from "@/store/toastStore";

export default function KitchenSettingsScreen() {
  const logout = useLogout();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const { data: kitchen } = useMyKitchen();
  const queryClient = useQueryClient();
  const [autoAcceptSaving, setAutoAcceptSaving] = useState(false);

  const onToggleAutoAccept = async (value: boolean) => {
    if (!kitchen) return;
    setAutoAcceptSaving(true);
    try {
      await kitchensApi.update(kitchen.id, { auto_accept_orders: value });
      await queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
      toast.success(value ? "New orders will be accepted automatically" : "Auto-accept turned off");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setAutoAcceptSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Settings</Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="mb-1 text-sm font-bold text-neutral-900">Orders</Text>
        <View className="flex-row items-center gap-3 py-2.5">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-neutral-800">Auto-Accept Orders</Text>
            <Text className="text-xs text-neutral-500">New orders are accepted automatically — skip the manual tap</Text>
          </View>
          <Switch
            value={kitchen?.auto_accept_orders ?? false}
            onValueChange={onToggleAutoAccept}
            disabled={!kitchen || autoAcceptSaving}
            trackColor={{ true: "#F25C1F" }}
          />
        </View>

        <View className="my-6 h-px bg-neutral-100" />

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

        <DeleteAccountSection warningMessage="This permanently closes your account and suspends your kitchen — it will no longer be visible to customers. Past orders and reviews stay on record." />
      </ScrollView>

      <ConfirmModal
        visible={logoutModalVisible}
        title="Log out?"
        message="You'll need to log in again to manage your kitchen."
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
