import { useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateAddress } from "@/hooks/useAddresses";
import { useLocation } from "@/hooks/useLocation";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";

const LABELS = ["Home", "Work", "Other"];

export default function AddAddressScreen() {
  const { coords } = useLocation();
  const createAddress = useCreateAddress();

  const [label, setLabel] = useState("Home");
  const [fullAddress, setFullAddress] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [instructions, setInstructions] = useState("");

  const onSave = () => {
    if (fullAddress.trim().length < 4) {
      toast.error("Please enter a complete address.");
      return;
    }
    createAddress.mutate(
      {
        label,
        full_address: fullAddress.trim(),
        area: area.trim() || undefined,
        city: city.trim() || undefined,
        instructions: instructions.trim() || undefined,
        location: coords ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Address saved");
          router.back();
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't save this address.")),
      }
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <ArrowLeft size={18} color="#332F2A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Add Address</Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
        <View className="mb-4 flex-row items-center gap-2 rounded-xl bg-primary-50 px-4 py-3">
          <MapPin size={16} color="#F25C1F" />
          <Text className="flex-1 text-xs text-primary-700">
            {coords ? "Using your current location for delivery estimates." : "Location not detected — you can still save this address."}
          </Text>
        </View>

        <Text className="mb-2 text-sm font-semibold text-neutral-700">Label</Text>
        <View className="mb-4 flex-row gap-2">
          {LABELS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLabel(l)}
              className={`rounded-full border px-4 py-2 ${label === l ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}
            >
              <Text className={`text-xs font-semibold ${label === l ? "text-primary-600" : "text-neutral-600"}`}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <View className="gap-4">
          <Input label="Full address" placeholder="House 12, Street 4, ..." value={fullAddress} onChangeText={setFullAddress} multiline />
          <Input label="Area" placeholder="Gulberg" value={area} onChangeText={setArea} />
          <Input label="City" placeholder="Lahore" value={city} onChangeText={setCity} />
          <Input label="Delivery instructions (optional)" placeholder="Leave at the gate, call on arrival..." value={instructions} onChangeText={setInstructions} />
        </View>
      </ScrollView>

      <View className="px-5 pb-8 pt-4">
        <Button label="Save Address" fullWidth loading={createAddress.isPending} onPress={onSave} />
      </View>
    </SafeAreaView>
  );
}
