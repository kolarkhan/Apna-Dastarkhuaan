import { useRef, useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, MessageCircleOff, Send } from "lucide-react-native";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/EmptyState";
import { FullScreenLoading } from "@/components/ui/Loading";
import { useCurrentUser } from "@/hooks/useAuth";
import { useChatMessages, useSendMessage } from "@/hooks/useChat";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import type { ChatMessage } from "@/types/api";

interface ChatThreadProps {
  orderId: string;
  title: string;
  subtitle?: string;
  canChat: boolean;
}

export function ChatThread({ orderId, title, subtitle, canChat }: ChatThreadProps) {
  const user = useCurrentUser();
  const { data: messages, isLoading } = useChatMessages(orderId);
  useOrderTracking(orderId);
  const sendMessage = useSendMessage(orderId);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const onSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    sendMessage.mutate(trimmed, {
      onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't send your message.")),
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-neutral-100 px-5 pb-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-base font-bold text-neutral-900">{title}</Text>
          {subtitle ? <Text numberOfLines={1} className="text-xs text-neutral-500">{subtitle}</Text> : null}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {isLoading ? (
          <FullScreenLoading />
        ) : !messages || messages.length === 0 ? (
          <EmptyState title="No messages yet" message="Say hello — your message will reach them instantly." />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => <Bubble message={item} mine={item.sender_role === user?.role} />}
          />
        )}

        {canChat ? (
          <View className="flex-row items-end gap-2.5 border-t border-neutral-100 px-4 py-3">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor="#AFA79B"
              multiline
              className="max-h-28 flex-1 rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-900"
            />
            <Pressable
              onPress={onSend}
              disabled={!text.trim() || sendMessage.isPending}
              className={`h-11 w-11 items-center justify-center rounded-full ${text.trim() ? "bg-primary-500" : "bg-neutral-200"}`}
            >
              <Send size={18} color={text.trim() ? "#fff" : "#AFA79B"} />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center justify-center gap-2 border-t border-neutral-100 px-5 py-4">
            <MessageCircleOff size={15} color="#AFA79B" />
            <Text className="text-xs font-medium text-neutral-500">Chat is closed for this order</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <View className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? "self-end bg-primary-500" : "self-start bg-neutral-100"}`}>
      <Text className={`text-sm ${mine ? "text-white" : "text-neutral-800"}`}>{message.text}</Text>
      <Text className={`mt-1 text-[10px] ${mine ? "text-primary-100" : "text-neutral-400"}`}>
        {new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </Text>
    </View>
  );
}
