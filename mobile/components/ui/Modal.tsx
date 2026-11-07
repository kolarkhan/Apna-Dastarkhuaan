import { Modal as RNModal, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!visible) return null;

  return (
    <RNModal transparent animationType="none" visible={visible} onRequestClose={onCancel}>
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} className="flex-1 items-center justify-center bg-black/50 px-6">
        <Pressable className="absolute inset-0" onPress={onCancel} />
        <Animated.View entering={ZoomIn.duration(180)} exiting={ZoomOut.duration(150)} className="w-full max-w-sm gap-2 rounded-3xl bg-white p-6">
          <Text className="text-lg font-bold text-neutral-900">{title}</Text>
          {message ? <Text className="text-sm text-neutral-600">{message}</Text> : null}
          <View className="mt-5 flex-row gap-3">
            <Pressable onPress={onCancel} className="flex-1 items-center rounded-xl border border-neutral-200 py-3.5 active:bg-neutral-50">
              <Text className="font-semibold text-neutral-700">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 items-center rounded-xl py-3.5 ${destructive ? "bg-danger-500 active:bg-danger-600" : "bg-primary-500 active:bg-primary-600"}`}
            >
              <Text className="font-semibold text-white">{confirmLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}
