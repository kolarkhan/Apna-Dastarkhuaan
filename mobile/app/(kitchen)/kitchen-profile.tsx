import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FullScreenLoading } from "@/components/ui/Loading";
import { useMyKitchen } from "@/hooks/useKitchens";
import { getApiErrorMessage } from "@/services/api/client";
import { kitchensApi } from "@/services/api/kitchens";
import { queryKeys } from "@/services/queryClient";
import { toast } from "@/store/toastStore";

export default function KitchenProfileScreen() {
  const { data: kitchen, isLoading } = useMyKitchen();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (kitchen) {
      setName(kitchen.name);
      setDescription(kitchen.description);
      setAddress(kitchen.address);
    }
  }, [kitchen]);

  if (isLoading || !kitchen) return <FullScreenLoading />;

  const onSave = async () => {
    setSaving(true);
    try {
      await kitchensApi.update(kitchen.id, { name: name.trim(), description: description.trim(), address: address.trim() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
      toast.success("Kitchen profile updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onPickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error("Photo library access is needed to upload an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    setUploadingImage(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? "kitchen.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);

      await kitchensApi.uploadImage(kitchen.id, formData);
      await queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
      toast.success("Kitchen photo updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't upload image."));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Kitchen Profile</Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Pressable onPress={onPickImage} className="relative mb-6 h-40 w-full overflow-hidden rounded-2xl bg-neutral-100">
          {kitchen.images[0] ? <Image source={{ uri: kitchen.images[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : null}
          <View className="absolute bottom-2 right-2 h-9 w-9 items-center justify-center rounded-full bg-white/90">
            <Camera size={16} color="#332F2A" />
          </View>
          {uploadingImage ? (
            <View className="absolute inset-0 items-center justify-center bg-black/30">
              <Text className="text-xs font-semibold text-white">Uploading...</Text>
            </View>
          ) : null}
        </Pressable>

        <View className="gap-4">
          <Input label="Kitchen name" value={name} onChangeText={setName} />
          <Input label="Description" value={description} onChangeText={setDescription} multiline style={{ minHeight: 90, textAlignVertical: "top" }} />
          <Input label="Address" value={address} onChangeText={setAddress} />
        </View>
      </ScrollView>

      <View className="px-5 pb-8 pt-2">
        <Button label="Save Changes" fullWidth loading={saving} onPress={onSave} />
      </View>
    </SafeAreaView>
  );
}
