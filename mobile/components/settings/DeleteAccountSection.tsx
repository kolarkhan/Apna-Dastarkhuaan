import { useState } from "react";
import { Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogout } from "@/hooks/useAuth";
import { useDeleteAccount } from "@/hooks/useUpdateProfile";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";

export function DeleteAccountSection({ warningMessage }: { warningMessage: string }) {
  const deleteAccount = useDeleteAccount();
  const logout = useLogout();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [password, setPassword] = useState("");

  const onConfirm = () => {
    if (!password) {
      toast.error("Enter your password to confirm.");
      return;
    }
    deleteAccount.mutate(password, {
      onSuccess: () => {
        setSheetVisible(false);
        toast.success("Your account has been deleted");
        logout.mutate();
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't delete your account.")),
    });
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setPassword("");
          setSheetVisible(true);
        }}
        className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-danger-50"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-danger-50">
          <Trash2 size={18} color="#DC2626" />
        </View>
        <Text className="flex-1 text-sm font-semibold text-danger-600">Delete Account</Text>
      </Pressable>

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <View className="gap-4 pb-2">
          <Text className="text-lg font-bold text-neutral-900">Delete your account?</Text>
          <Text className="text-sm text-neutral-600">{warningMessage}</Text>
          <Input
            label="Confirm your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
          />
          <Button
            label="Permanently Delete Account"
            variant="danger"
            fullWidth
            loading={deleteAccount.isPending}
            onPress={onConfirm}
          />
        </View>
      </BottomSheet>
    </>
  );
}
