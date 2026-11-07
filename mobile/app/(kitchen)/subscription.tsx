import { useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, Banknote, Check, CreditCard, Crown, Smartphone } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { FullScreenLoading } from "@/components/ui/Loading";
import { formatPKR } from "@/components/ui/PriceRow";
import { useCancelSubscription, useMySubscription, useSubscribe, useSubscriptionPlans } from "@/hooks/useSubscription";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import type { SubscriptionPaymentMethod } from "@/types/api";

const METHODS: { value: SubscriptionPaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "easypaisa", label: "Easypaisa", icon: Smartphone },
  { value: "bank_transfer", label: "Bank Transfer", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
];

export default function SubscriptionScreen() {
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: status, isLoading: statusLoading } = useMySubscription();
  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [method, setMethod] = useState<SubscriptionPaymentMethod>("easypaisa");
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  if (plansLoading || statusLoading || !plans || !status) return <FullScreenLoading />;

  const isPro = status.plan === "pro";
  const proPlan = plans.find((p) => p.id === "pro");

  const onConfirmSubscribe = () => {
    subscribe.mutate(method, {
      onSuccess: (data) => {
        toast.success(data.message);
        setSheetVisible(false);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const onConfirmCancel = () => {
    cancel.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(data.message);
        setCancelModalVisible(false);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Subscription</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        {isPro ? (
          <View className="items-center gap-2 rounded-3xl bg-neutral-900 py-7">
            <Crown size={22} color="#FDBA92" />
            <Text className="text-lg font-extrabold text-white">Pro Kitchen</Text>
            {status.expires_at ? (
              <Text className="text-xs text-neutral-400">
                Renews on {new Date(status.expires_at).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        ) : null}

        {plans.map((plan) => {
          const active = plan.id === status.plan;
          return (
            <View
              key={plan.id}
              className={`gap-3 rounded-3xl border p-5 ${
                plan.id === "pro" ? "border-primary-300 bg-primary-50" : "border-neutral-100"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  {plan.id === "pro" ? <Crown size={18} color="#F25C1F" /> : null}
                  <Text className="text-lg font-extrabold text-neutral-900">{plan.name}</Text>
                </View>
                {active ? (
                  <View className="rounded-full bg-neutral-900 px-3 py-1">
                    <Text className="text-xs font-bold text-white">Current Plan</Text>
                  </View>
                ) : null}
              </View>

              <Text className="text-2xl font-extrabold text-neutral-900">
                {plan.price > 0 ? formatPKR(plan.price) : "Free"}
                {plan.price > 0 ? <Text className="text-sm font-medium text-neutral-500"> /month</Text> : null}
              </Text>

              <View className="gap-2">
                {plan.features.map((feature) => (
                  <View key={feature} className="flex-row items-center gap-2">
                    <Check size={15} color="#178A48" />
                    <Text className="flex-1 text-sm text-neutral-700">{feature}</Text>
                  </View>
                ))}
              </View>

              {plan.id === "pro" && !active ? (
                <Button label={`Upgrade to Pro — ${formatPKR(plan.price)}/mo`} onPress={() => setSheetVisible(true)} fullWidth />
              ) : null}
            </View>
          );
        })}

        {isPro ? (
          <Button label="Cancel Subscription" variant="outline" onPress={() => setCancelModalVisible(true)} fullWidth />
        ) : null}
      </ScrollView>

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <View className="gap-4 pb-2">
          <Text className="text-lg font-bold text-neutral-900">Upgrade to Pro Kitchen</Text>
          <Text className="text-sm text-neutral-500">
            {formatPKR(proPlan?.price ?? 0)}/month — unlocks unlimited listings, more photos, and priority placement.
          </Text>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-neutral-700">Pay With</Text>
            <View className="flex-row gap-2">
              {METHODS.map((m) => (
                <Pressable
                  key={m.value}
                  onPress={() => setMethod(m.value)}
                  className={`flex-1 items-center gap-1.5 rounded-xl border py-3 ${
                    method === m.value ? "border-primary-500 bg-primary-50" : "border-neutral-200"
                  }`}
                >
                  <m.icon size={16} color={method === m.value ? "#F25C1F" : "#665F57"} />
                  <Text className={`text-xs font-semibold ${method === m.value ? "text-primary-700" : "text-neutral-700"}`}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text className="text-xs text-neutral-500">
            This is a sandboxed demo payment — no real transaction is made.
          </Text>

          <Button
            label={`Confirm & Pay ${formatPKR(proPlan?.price ?? 0)}`}
            onPress={onConfirmSubscribe}
            loading={subscribe.isPending}
            fullWidth
          />
        </View>
      </BottomSheet>

      <ConfirmModal
        visible={cancelModalVisible}
        title="Cancel Pro Kitchen?"
        message="You'll move back to the Free plan immediately and lose priority placement, extra photos, and unlimited listings."
        confirmLabel="Cancel Subscription"
        destructive
        onConfirm={onConfirmCancel}
        onCancel={() => setCancelModalVisible(false)}
      />
    </SafeAreaView>
  );
}
