import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/services/api/client";
import { useRegister } from "@/hooks/useAuth";
import { toast } from "@/store/toastStore";
import { registerSchema, type RegisterFormValues } from "@/utils/validation";

export default function RegisterScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = roleParam === "kitchen_owner" ? "kitchen_owner" : "customer";
  const [showPassword, setShowPassword] = useState(false);
  const register = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (values: RegisterFormValues) => {
    register.mutate(
      { name: values.name, email: values.email, phone: values.phone, password: values.password, role },
      { onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't create your account.")) }
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-6" keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} hitSlop={8} className="mb-4 h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
            <ArrowLeft size={18} color="#332F2A" />
          </Pressable>

          <Text className="text-2xl font-extrabold text-neutral-900">
            {role === "kitchen_owner" ? "Set up your kitchen account" : "Create your account"}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">
            {role === "kitchen_owner" ? "Start selling your homemade food today." : "Join and discover homemade food near you."}
          </Text>

          <View className="mt-6 gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  label="Full name"
                  placeholder="Ayesha Khan"
                  leftIcon={<User size={18} color="#8A8177" />}
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.name?.message}
                />
              )}
            />
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
              name="phone"
              render={({ field }) => (
                <Input
                  label="Phone number"
                  placeholder="+92 300 1234567"
                  keyboardType="phone-pad"
                  leftIcon={<Phone size={18} color="#8A8177" />}
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.phone?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  label="Password"
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
                  label="Confirm password"
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
            <Button label="Create Account" fullWidth loading={register.isPending} onPress={handleSubmit(onSubmit)} />
          </View>

          <View className="mt-6 flex-row items-center justify-center gap-1.5 pb-6">
            <Text className="text-sm text-neutral-500">Already have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Text className="text-sm font-bold text-primary-600">Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
