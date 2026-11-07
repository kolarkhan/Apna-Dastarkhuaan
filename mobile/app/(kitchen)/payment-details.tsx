import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FullScreenLoading } from "@/components/ui/Loading";
import { BankTransferLogo, EasypaisaLogo, JazzCashLogo } from "@/components/ui/PaymentLogo";
import { useMyKitchen } from "@/hooks/useKitchens";
import { getApiErrorMessage } from "@/services/api/client";
import { kitchensApi } from "@/services/api/kitchens";
import { queryKeys } from "@/services/queryClient";
import { toast } from "@/store/toastStore";
import type { KitchenPaymentMethod } from "@/types/api";

const METHODS: { id: KitchenPaymentMethod; label: string; Logo: typeof EasypaisaLogo }[] = [
  { id: "easypaisa", label: "Easypaisa", Logo: EasypaisaLogo },
  { id: "jazzcash", label: "JazzCash", Logo: JazzCashLogo },
  { id: "bank_transfer", label: "Bank Transfer", Logo: BankTransferLogo },
];

export default function PaymentDetailsScreen() {
  const { data: kitchen, isLoading } = useMyKitchen();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [method, setMethod] = useState<KitchenPaymentMethod | null>(null);
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    if (kitchen) {
      setMethod(kitchen.payment_details.method);
      setAccountTitle(kitchen.payment_details.account_title ?? "");
      setAccountNumber(kitchen.payment_details.account_number ?? "");
      setBankName(kitchen.payment_details.bank_name ?? "");
    }
  }, [kitchen]);

  if (isLoading || !kitchen) return <FullScreenLoading />;

  const onSave = async () => {
    if (method && !accountNumber.trim()) {
      toast.error(method === "bank_transfer" ? "Enter your account number / IBAN." : "Enter your account number.");
      return;
    }
    setSaving(true);
    try {
      await kitchensApi.update(kitchen.id, {
        payment_details: {
          method,
          account_title: method ? accountTitle.trim() || null : null,
          account_number: method ? accountNumber.trim() || null : null,
          bank_name: method === "bank_transfer" ? bankName.trim() || null : null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
      toast.success("Payment details updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Payment Details</Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40, gap: 20 }}>
        <Text className="text-xs text-neutral-500">
          Pick the one method you accept online. Customers will see these exact details at checkout so they know
          where to send payment — Cash on Delivery and Card stay available either way.
        </Text>

        <View className="flex-row gap-3">
          {METHODS.map((m) => {
            const selected = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(selected ? null : m.id)}
                className={`flex-1 items-center gap-2 rounded-2xl border p-3 ${selected ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}
              >
                <m.Logo size={40} />
                <Text className={`text-xs font-bold ${selected ? "text-primary-700" : "text-neutral-700"}`}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {method === "easypaisa" || method === "jazzcash" ? (
          <View className="gap-3">
            <Input
              label={method === "easypaisa" ? "Easypaisa Number" : "JazzCash Number"}
              placeholder="03XX-XXXXXXX"
              keyboardType="phone-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
            <Input label="Account Title (optional)" placeholder="Name on the account" value={accountTitle} onChangeText={setAccountTitle} />
          </View>
        ) : method === "bank_transfer" ? (
          <View className="gap-3">
            <Input label="Bank Name" placeholder="e.g. HBL, Meezan Bank" value={bankName} onChangeText={setBankName} />
            <Input label="Account Title" placeholder="Name on the account" value={accountTitle} onChangeText={setAccountTitle} />
            <Input label="Account Number / IBAN" placeholder="e.g. PK00XXXX0000000000000000" value={accountNumber} onChangeText={setAccountNumber} />
          </View>
        ) : (
          <Text className="text-center text-xs text-neutral-400">
            No online method selected — customers will only see Cash on Delivery and Card.
          </Text>
        )}

        <Button label="Save Payment Details" fullWidth loading={saving} onPress={onSave} />
      </ScrollView>
    </SafeAreaView>
  );
}
