import { useState } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useCurrentUser } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/services/api/client";
import { usersApi } from "@/services/api/users";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

export function AvatarPicker() {
  const user = useCurrentUser();
  const setUser = useAuthStore((s) => s.setUser);
  const [uploading, setUploading] = useState(false);

  const onPick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error("Photo library access is needed to upload a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0] || !user) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);

      const { avatar } = await usersApi.uploadAvatar(formData);
      setUser({ ...user, avatar });
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't upload photo."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="items-center gap-2 pb-2">
      <Pressable onPress={onPick} className="relative h-20 w-20 items-center justify-center rounded-full bg-primary-100">
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={{ width: "100%", height: "100%", borderRadius: 40 }} contentFit="cover" />
        ) : (
          <Text className="text-3xl font-extrabold text-primary-700">{user?.name.charAt(0) ?? "A"}</Text>
        )}
        <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-900">
          <Camera size={13} color="#fff" />
        </View>
        {uploading ? (
          <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
            <Text className="text-[10px] font-semibold text-white">Uploading…</Text>
          </View>
        ) : null}
      </Pressable>
      <Text className="text-sm font-bold text-neutral-900">{user?.name}</Text>
      <Text className="text-xs text-neutral-500">{user?.email}</Text>
    </View>
  );
}
