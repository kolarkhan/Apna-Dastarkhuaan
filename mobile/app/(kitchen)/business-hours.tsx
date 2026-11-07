import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FullScreenLoading } from "@/components/ui/Loading";
import { useMyKitchen } from "@/hooks/useKitchens";
import { getApiErrorMessage } from "@/services/api/client";
import { kitchensApi } from "@/services/api/kitchens";
import { queryKeys } from "@/services/queryClient";
import { toast } from "@/store/toastStore";
import type { BusinessHourEntry } from "@/types/api";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

export default function BusinessHoursScreen() {
  const { data: kitchen, isLoading } = useMyKitchen();
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<BusinessHourEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (kitchen) {
      const existing = new Map(kitchen.business_hours.map((h) => [h.day, h]));
      setHours(DAYS.map((day) => existing.get(day) ?? { day, open_time: "11:00", close_time: "23:00", closed: false }));
    }
  }, [kitchen]);

  if (isLoading || !kitchen) return <FullScreenLoading />;

  const updateDay = (day: string, patch: Partial<BusinessHourEntry>) => {
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await kitchensApi.updateBusinessHours(kitchen.id, hours);
      await queryClient.invalidateQueries({ queryKey: queryKeys.kitchens.mine });
      toast.success("Business hours updated");
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
        <Text className="text-xl font-bold text-neutral-900">Business Hours</Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 12 }}>
        {hours.map((h) => (
          <View key={h.day} className="rounded-2xl border border-neutral-100 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-neutral-900">{DAY_LABELS[h.day]}</Text>
              <Switch value={!h.closed} onValueChange={(open) => updateDay(h.day, { closed: !open })} trackColor={{ true: "#F25C1F" }} />
            </View>
            {!h.closed ? (
              <View className="mt-3 flex-row gap-3">
                <View className="flex-1">
                  <Input label="Open" value={h.open_time} onChangeText={(v) => updateDay(h.day, { open_time: v })} placeholder="11:00" />
                </View>
                <View className="flex-1">
                  <Input label="Close" value={h.close_time} onChangeText={(v) => updateDay(h.day, { close_time: v })} placeholder="23:00" />
                </View>
              </View>
            ) : (
              <Text className="mt-2 text-xs text-neutral-400">Closed all day</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View className="px-5 pb-8 pt-2">
        <Button label="Save Hours" fullWidth loading={saving} onPress={onSave} />
      </View>
    </SafeAreaView>
  );
}
