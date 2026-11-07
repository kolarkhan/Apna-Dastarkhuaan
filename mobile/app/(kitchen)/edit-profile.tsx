import { useState } from "react";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ScrollView, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AvatarPicker } from "@/components/settings/AvatarPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCurrentUser } from "@/hooks/useAuth";
import { useChangePassword, useUpdateProfile } from "@/hooks/useUpdateProfile";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";

export default function EditProfileScreen() {
  const user = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const onSaveProfile = () => {
    updateProfile.mutate(
      { name, phone },
      { onSuccess: () => toast.success("Profile updated"), onError: (error) => toast.error(getApiErrorMessage(error)) }
    );
  };

  const onChangePassword = () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          toast.success("Password changed");
          setCurrentPassword("");
          setNewPassword("");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      }
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Profile</Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <AvatarPicker />

        <View className="my-6 h-px bg-neutral-100" />

        <Text className="mb-3 text-sm font-bold text-neutral-900">Account</Text>
        <View className="gap-4">
          <Input label="Full name" value={name} onChangeText={setName} />
          <Input label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View className="mt-4">
          <Button label="Save Changes" variant="outline" onPress={onSaveProfile} loading={updateProfile.isPending} />
        </View>

        <View className="my-6 h-px bg-neutral-100" />

        <Text className="mb-3 text-sm font-bold text-neutral-900">Change Password</Text>
        <View className="gap-4">
          <Input label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <Input label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        </View>
        <View className="mt-4">
          <Button label="Change Password" variant="outline" onPress={onChangePassword} loading={changePassword.isPending} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
