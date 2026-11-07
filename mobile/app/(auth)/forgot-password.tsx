import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useForgotPassword } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/utils/validation";

export default function ForgotPasswordScreen() {
  const forgotPassword = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPassword.mutate(values.email, {
      onSuccess: (data) => {
        toast.success("If that email exists, a reset link has been sent.");
        if (data.dev_reset_token) {
          // Dev convenience since no email provider is wired up yet.
          router.push({ pathname: "/(auth)/reset-password", params: { token: data.dev_reset_token } });
        } else {
          router.back();
        }
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 py-6">
      <Pressable onPress={() => router.back()} hitSlop={8} className="mb-4 h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
        <ArrowLeft size={18} color="#332F2A" />
      </Pressable>

      <Text className="text-2xl font-extrabold text-neutral-900">Forgot password?</Text>
      <Text className="mt-1 text-sm text-neutral-500">Enter your email and we'll send you a reset link.</Text>

      <View className="mt-6">
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color="#8A8177" />}
              value={field.value}
              onChangeText={field.onChange}
              error={errors.email?.message}
            />
          )}
        />
      </View>

      <View className="mt-8">
        <Button label="Send Reset Link" fullWidth loading={forgotPassword.isPending} onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
}
