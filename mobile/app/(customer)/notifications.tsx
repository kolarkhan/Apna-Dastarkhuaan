import { router } from "expo-router";
import { ArrowLeft, Bell } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/EmptyState";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";
import type { AppNotification } from "@/types/api";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
            <ArrowLeft size={18} color="#332F2A" />
          </Pressable>
          <Text className="text-xl font-bold text-neutral-900">Notifications</Text>
        </View>
        {notifications.some((n) => !n.read) ? (
          <Pressable onPress={() => markAllRead.mutate()}>
            <Text className="text-xs font-semibold text-primary-600">Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {!isLoading && notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="We'll let you know when something happens with your orders." />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => <NotificationRow item={item} onPress={() => !item.read && markRead.mutate(item.id)} />}
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`flex-row gap-3 border-b border-neutral-50 px-5 py-4 ${!item.read ? "bg-primary-50/40" : ""}`}>
      <View className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: item.read ? "transparent" : "#F25C1F" }} />
      <View className="flex-1">
        <Text className="text-sm font-bold text-neutral-900">{item.title}</Text>
        <Text className="mt-0.5 text-xs text-neutral-500">{item.body}</Text>
        <Text className="mt-1 text-[11px] text-neutral-400">{timeAgo(item.created_at)}</Text>
      </View>
    </Pressable>
  );
}
