import { Switch, Text, View } from "react-native";

import { useCurrentUser } from "@/hooks/useAuth";
import { useUpdateNotificationPreferences } from "@/hooks/useUpdateProfile";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import type { NotificationPreferences } from "@/types/api";

const DEFAULT_PREFS: NotificationPreferences = { order_updates: true, chat_messages: true, announcements: true };

const ROWS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "order_updates", label: "Order Updates", description: "Status changes on your orders" },
  { key: "chat_messages", label: "Chat Messages", description: "New messages in order chats" },
  { key: "announcements", label: "Announcements", description: "News, offers, and platform updates" },
];

export function NotificationPreferencesSection() {
  const user = useCurrentUser();
  const updatePrefs = useUpdateNotificationPreferences();
  const prefs = user?.notification_preferences ?? DEFAULT_PREFS;

  const toggle = (key: keyof NotificationPreferences) => {
    updatePrefs.mutate(
      { ...prefs, [key]: !prefs[key] },
      { onError: (error) => toast.error(getApiErrorMessage(error)) }
    );
  };

  return (
    <View className="gap-1">
      {ROWS.map((row) => (
        <View key={row.key} className="flex-row items-center gap-3 py-2.5">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-neutral-800">{row.label}</Text>
            <Text className="text-xs text-neutral-500">{row.description}</Text>
          </View>
          <Switch value={prefs[row.key]} onValueChange={() => toggle(row.key)} trackColor={{ true: "#F25C1F" }} />
        </View>
      ))}
    </View>
  );
}
