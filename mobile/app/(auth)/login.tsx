import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/services/api/client";
import { useLogin } from "@/hooks/useAuth";
import { toast } from "@/store/toastStore";
import { loginSchema, type LoginFormValues } from "@/utils/validation";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't log in. Please try again.")),
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="flex-1 px-6 py-8" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-extrabold text-neutral-900">Welcome back</Text>
          <Text className="mt-1 text-sm text-neutral-500">Log in to continue ordering ghar ka khana.</Text>

          <View className="mt-8 gap-4">
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

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
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

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable className="self-end">
                <Text className="text-sm font-semibold text-primary-600">Forgot password?</Text>
              </Pressable>
            </Link>
          </View>

          <View className="mt-8">
            <Button label="Log In" fullWidth loading={login.isPending} onPress={handleSubmit(onSubmit)} />
          </View>

          <View className="mt-auto flex-row items-center justify-center gap-1.5 pt-8">
            <Text className="text-sm text-neutral-500">Don't have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/choose-role")}>
              <Text className="text-sm font-bold text-primary-600">Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
