import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useResetPassword } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/utils/validation";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const resetPassword = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error("This reset link is invalid.");
      return;
    }
    resetPassword.mutate(
      { token, newPassword: values.password },
      {
        onSuccess: () => {
          toast.success("Password reset! Please log in.");
          router.replace("/(auth)/login");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 py-6">
      <Text className="text-2xl font-extrabold text-neutral-900">Set a new password</Text>
      <Text className="mt-1 text-sm text-neutral-500">Choose a strong password you haven't used before.</Text>

      <View className="mt-6 gap-4">
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input
              label="New password"
              placeholder="At least 8 characters"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={18} color="#8A8177" />}
              rightIcon={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  {showPassword ? <EyeOff size={18} color="#8A8177" /> : <Eye size={18} color="#8A8177" />}
                </Pressable>
              }
              value={field.value}
              onChangeText={field.onChange}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <Input
              label="Confirm new password"
              placeholder="Re-enter your password"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={18} color="#8A8177" />}
              value={field.value}
              onChangeText={field.onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />
      </View>

      <View className="mt-8">
        <Button label="Reset Password" fullWidth loading={resetPassword.isPending} onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
}
