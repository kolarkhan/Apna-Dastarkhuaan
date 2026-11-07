import { useState } from "react";
import { router } from "expo-router";
import { ChefHat, MapPin } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLocation } from "@/hooks/useLocation";
import { kitchensApi } from "@/services/api/kitchens";
import { getApiErrorMessage } from "@/services/api/client";
import { toast } from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryClient";

const CUISINE_OPTIONS = ["Pakistani", "Punjabi", "Balochi", "Pashtun", "Afghan", "BBQ", "Biryani", "Desserts"];
const DEFAULT_HOURS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => ({
  day,
  open_time: "11:00",
  close_time: "23:00",
  closed: false,
}));

export default function KitchenOnboardingScreen() {
  const { coords, refresh } = useLocation();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [cuisineTags, setCuisineTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleCuisine = (tag: string) => {
    setCuisineTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const onSubmit = async () => {
    if (name.trim().length < 2 || description.trim().length < 10 || address.trim().length < 4) {
      toast.error("Please fill in all fields — description needs at least 10 characters.");
      return;
    }
    if (!coords) {
      toast.error("We need your location to set up your kitchen. Please enable location access.");
      return;
    }

    setSubmitting(true);
    try {
      await kitchensApi.create({
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        location: coords,
        cuisine_tags: cuisineTags,
        business_hours: DEFAULT_HOURS,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
      toast.success("Kitchen created! Awaiting admin approval.");
      router.replace("/(kitchen)/(tabs)");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't create your kitchen."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center gap-2">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-secondary-100">
            <ChefHat size={28} color="#C8850F" />
          </View>
          <Text className="text-2xl font-extrabold text-neutral-900">Set up your kitchen</Text>
          <Text className="text-center text-sm text-neutral-500">
            Tell us about your home kitchen. An admin will review and approve it before it goes live.
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <Input label="Kitchen name" placeholder="e.g. Ammi's Kitchen" value={name} onChangeText={setName} />
          <Input
            label="Description"
            placeholder="Tell customers what makes your food special..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: "top" }}
          />
          <Input label="Address" placeholder="House, street, area, city" value={address} onChangeText={setAddress} />

          <Pressable onPress={refresh} className="flex-row items-center gap-2 rounded-xl bg-primary-50 px-4 py-3">
            <MapPin size={16} color="#F25C1F" />
            <Text className="flex-1 text-xs text-primary-700">
              {coords ? "Location set from your current position." : "Tap to detect your kitchen's location"}
            </Text>
          </Pressable>

          <View>
            <Text className="mb-2 text-sm font-semibold text-neutral-700">Cuisine tags</Text>
            <View className="flex-row flex-wrap gap-2">
              {CUISINE_OPTIONS.map((tag) => {
                const selected = cuisineTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleCuisine(tag)}
                    className={`rounded-full border px-3.5 py-2 ${selected ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}
                  >
                    <Text className={`text-xs font-semibold ${selected ? "text-primary-600" : "text-neutral-600"}`}>{tag}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View className="mt-8">
          <Button label="Create Kitchen" fullWidth loading={submitting} onPress={onSubmit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
