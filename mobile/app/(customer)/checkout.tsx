import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Banknote, ChevronRight, Copy, CreditCard, MapPin } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { FullScreenLoading } from "@/components/ui/Loading";
import { BankTransferLogo, EasypaisaLogo, JazzCashLogo } from "@/components/ui/PaymentLogo";
import { formatPKR, PriceRow } from "@/components/ui/PriceRow";
import { useAddresses } from "@/hooks/useAddresses";
import { useFood } from "@/hooks/useFoods";
import { useKitchen } from "@/hooks/useKitchens";
import { useCreateOrder } from "@/hooks/useOrders";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import { useUiStore } from "@/store/uiStore";
import type { PaymentMethod } from "@/types/api";

const DELIVERY_FEE = 99.0;
const SERVICE_FEE_RATE = 0.03;

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; description: string }[] = [
  { id: "cod", label: "Cash on Delivery", description: "Pay when your order arrives" },
  { id: "easypaisa", label: "Easypaisa", description: "Pay directly to the kitchen's Easypaisa" },
  { id: "jazzcash", label: "JazzCash", description: "Pay directly to the kitchen's JazzCash" },
  { id: "bank_transfer", label: "Bank Transfer", description: "Transfer directly to the kitchen's bank account" },
  { id: "card", label: "Debit / Credit Card", description: "Visa, Mastercard supported" },
];

function PaymentOptionLogo({ id, selected }: { id: PaymentMethod; selected: boolean }) {
  if (id === "easypaisa") return <EasypaisaLogo size={40} />;
  if (id === "jazzcash") return <JazzCashLogo size={40} />;
  if (id === "bank_transfer") return <BankTransferLogo size={40} />;
  const Icon = id === "card" ? CreditCard : Banknote;
  return (
    <View className={`h-10 w-10 items-center justify-center rounded-full ${selected ? "bg-primary-500" : "bg-neutral-100"}`}>
      <Icon size={18} color={selected ? "#fff" : "#665F57"} />
    </View>
  );
}

function copyToClipboard(value: string, label: string) {
  Clipboard.setStringAsync(value);
  toast.success(`${label} copied`);
}

export default function CheckoutScreen() {
  const { foodId, quantity: quantityParam, customizations: customizationsParam } = useLocalSearchParams<{
    foodId: string;
    quantity: string;
    customizations?: string;
  }>();
  const quantity = Number(quantityParam) || 1;
  const customizations: string[] = useMemo(() => {
    try {
      return customizationsParam ? JSON.parse(customizationsParam) : [];
    } catch {
      return [];
    }
  }, [customizationsParam]);

  const { data: food, isLoading: foodLoading, isError, refetch } = useFood(foodId);
  const { data: kitchen } = useKitchen(food?.kitchen_id);
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const selectedAddressId = useUiStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useUiStore((s) => s.setSelectedAddressId);
  const createOrder = useCreateOrder();

  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  useEffect(() => {
    if (!selectedAddressId && addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId, setSelectedAddressId]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  const paymentDetails = kitchen?.payment_details;
  const availableOptions = PAYMENT_OPTIONS.filter(
    (opt) => opt.id === "cod" || opt.id === "card" || opt.id === paymentDetails?.method
  );

  const extraTotal = food
    ? customizations.reduce((sum, name) => {
        const opt = food.customization_options.find((o) => o.name === name);
        return sum + (opt?.price_delta ?? 0);
      }, 0)
    : 0;
  const unitPrice = (food?.price ?? 0) + extraTotal;
  const subtotal = unitPrice * quantity;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  const total = subtotal + serviceFee + DELIVERY_FEE;

  const onPlaceOrder = () => {
    if (!food) return;
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    createOrder.mutate(
      {
        food_id: food.id,
        quantity,
        customizations,
        address_id: selectedAddressId,
        payment_method: paymentMethod,
      },
      {
        onSuccess: (order) => {
          toast.success("Order placed!");
          router.replace({ pathname: "/(customer)/order/[id]", params: { id: order.id, justPlaced: "1" } });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't place your order.")),
      }
    );
  };

  if (foodLoading || addressesLoading) return <FullScreenLoading />;
  if (isError || !food) return <ErrorState message="Couldn't load this dish." onRetry={refetch} />;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Checkout</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Delivery address */}
        <Text className="mb-2 text-sm font-bold text-neutral-900">Delivery Address</Text>
        <Pressable
          onPress={() => (addresses && addresses.length > 0 ? setAddressSheetOpen(true) : router.push("/(customer)/address/add"))}
          className="mb-6 flex-row items-center gap-3 rounded-2xl border border-neutral-200 p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50">
            <MapPin size={18} color="#F25C1F" />
          </View>
          <View className="flex-1">
            {selectedAddress ? (
              <>
                <Text className="text-sm font-bold text-neutral-900">{selectedAddress.label}</Text>
                <Text numberOfLines={1} className="text-xs text-neutral-500">{selectedAddress.full_address}</Text>
              </>
            ) : (
              <Text className="text-sm font-semibold text-primary-600">Add a delivery address</Text>
            )}
          </View>
          <ChevronRight size={18} color="#AFA79B" />
        </Pressable>

        {/* Order summary */}
        <Text className="mb-2 text-sm font-bold text-neutral-900">Order Summary</Text>
        <View className="mb-6 rounded-2xl bg-neutral-50 p-4">
          <View className="flex-row items-center justify-between py-1">
            <Text className="flex-1 text-sm text-neutral-700" numberOfLines={1}>
              {quantity}× {food.name}
            </Text>
            <Text className="text-sm font-semibold text-neutral-800">{formatPKR(subtotal)}</Text>
          </View>
          {customizations.length > 0 ? (
            <Text className="text-xs text-neutral-500">{customizations.join(", ")}</Text>
          ) : null}
          <View className="my-2 h-px bg-neutral-200" />
          <PriceRow label="Subtotal" value={subtotal} />
          <PriceRow label="Delivery fee" value={DELIVERY_FEE} />
          <PriceRow label="Service fee" value={serviceFee} />
          <View className="my-2 h-px bg-neutral-200" />
          <PriceRow label="Total" value={total} emphasis />
        </View>

        {/* Payment method */}
        <Text className="mb-2 text-sm font-bold text-neutral-900">Payment Method</Text>
        <View className="mb-3 gap-2.5">
          {availableOptions.map((opt) => {
            const selected = paymentMethod === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setPaymentMethod(opt.id)}
                className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${selected ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}
              >
                <PaymentOptionLogo id={opt.id} selected={selected} />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-neutral-900">{opt.label}</Text>
                  <Text className="text-xs text-neutral-500">{opt.description}</Text>
                </View>
                <View className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? "border-primary-500" : "border-neutral-300"}`}>
                  {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary-500" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {paymentMethod === paymentDetails?.method && paymentDetails?.account_number ? (
          <PaymentAccountCard
            rows={[
              ...(paymentDetails.bank_name ? [{ label: "Bank", value: paymentDetails.bank_name }] : []),
              ...(paymentDetails.account_title ? [{ label: "Account Title", value: paymentDetails.account_title }] : []),
              {
                label: paymentMethod === "bank_transfer" ? "Account Number" : "Number",
                value: paymentDetails.account_number,
              },
            ]}
          />
        ) : null}

        <View className="h-8" />
      </ScrollView>

      <View className="border-t border-neutral-100 px-5 pb-8 pt-4">
        <Button label={`Place Order · ${formatPKR(total)}`} fullWidth loading={createOrder.isPending} onPress={onPlaceOrder} />
      </View>

      <BottomSheet visible={addressSheetOpen} onClose={() => setAddressSheetOpen(false)}>
        <Text className="mb-4 text-lg font-bold text-neutral-900">Choose delivery address</Text>
        <View className="gap-2.5">
          {addresses?.map((addr) => (
            <Pressable
              key={addr.id}
              onPress={() => {
                setSelectedAddressId(addr.id);
                setAddressSheetOpen(false);
              }}
              className={`rounded-xl border p-3.5 ${selectedAddressId === addr.id ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}
            >
              <Text className="text-sm font-bold text-neutral-900">{addr.label}</Text>
              <Text className="text-xs text-neutral-500">{addr.full_address}</Text>
            </Pressable>
          ))}
        </View>
        <View className="mt-4">
          <Button
            label="Add New Address"
            variant="outline"
            fullWidth
            onPress={() => {
              setAddressSheetOpen(false);
              router.push("/(customer)/address/add");
            }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function PaymentAccountCard({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <View className="mb-5 gap-2.5 rounded-2xl border border-primary-100 bg-primary-50 p-4">
      <Text className="text-xs font-semibold text-primary-700">Send payment to this account before confirming your order</Text>
      {rows.map((row) => (
        <Pressable
          key={row.label}
          onPress={() => copyToClipboard(row.value, row.label)}
          className="flex-row items-center justify-between"
        >
          <View>
            <Text className="text-xs text-primary-600">{row.label}</Text>
            <Text className="text-sm font-bold text-neutral-900">{row.value}</Text>
          </View>
          <Copy size={15} color="#DC4515" />
        </Pressable>
      ))}
    </View>
  );
}
