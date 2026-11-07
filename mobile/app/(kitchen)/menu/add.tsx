import { useState } from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, X } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCategories } from "@/hooks/useCategories";
import { useCreateFood } from "@/hooks/useMenu";
import { getApiErrorMessage } from "@/services/api/client";
import { foodsApi } from "@/services/api/foods";
import { toast } from "@/store/toastStore";
import type { SpiceLevel } from "@/types/api";

const SPICE_LEVELS: SpiceLevel[] = ["mild", "medium", "spicy"];

export default function AddFoodScreen() {
  const { data: categories } = useCategories();
  const createFood = useCreateFood();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [ingredients, setIngredients] = useState("");
  const [portion, setPortion] = useState("1 person");
  const [prepTime, setPrepTime] = useState("30");
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>("medium");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onPickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error("Photo library access is needed to upload an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setImage(result.assets[0]);
  };

  const onSubmit = async () => {
    const priceNum = Number(price);
    if (name.trim().length < 2 || description.trim().length < 5 || !priceNum || priceNum <= 0 || !categoryId) {
      toast.error("Please fill in name, description, a valid price, and category.");
      return;
    }

    setSubmitting(true);
    createFood.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        category_id: categoryId,
        ingredients: ingredients.split(",").map((i) => i.trim()).filter(Boolean),
        portion,
        preparation_time_minutes: Number(prepTime) || 30,
        spice_level: spiceLevel,
        customization_options: [
          { name: "Extra spicy", price_delta: 0 },
          { name: "Less spicy", price_delta: 0 },
          { name: "No onion", price_delta: 0 },
        ],
        available: true,
      },
      {
        onSuccess: async (created) => {
          if (image) {
            try {
              const formData = new FormData();
              formData.append("file", {
                uri: image.uri,
                name: image.fileName ?? "food.jpg",
                type: image.mimeType ?? "image/jpeg",
              } as unknown as Blob);
              await foodsApi.uploadImage(created.id, formData);
              await queryClient.invalidateQueries({ queryKey: ["foods"] });
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Dish added, but the photo didn't upload."));
            }
          }
          setSubmitting(false);
          toast.success("Dish added to your menu!");
          router.back();
        },
        onError: (error) => {
          setSubmitting(false);
          toast.error(getApiErrorMessage(error, "Couldn't add this dish."));
        },
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 py-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold text-neutral-900">Add Food</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color="#332F2A" />
        </Pressable>
      </View>

      <ScrollView className="mt-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="gap-4">
          <Pressable onPress={onPickImage} className="relative h-36 w-full overflow-hidden rounded-2xl bg-neutral-100">
            {image ? (
              <Image source={{ uri: image.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center gap-1.5">
                <Camera size={22} color="#AFA79B" />
                <Text className="text-xs font-semibold text-neutral-500">Add a photo of your dish</Text>
              </View>
            )}
            {image ? (
              <View className="absolute bottom-2 right-2 h-9 w-9 items-center justify-center rounded-full bg-white/90">
                <Camera size={16} color="#332F2A" />
              </View>
            ) : null}
          </Pressable>

          <Input label="Dish name" placeholder="e.g. Chicken Biryani" value={name} onChangeText={setName} />
          <Input label="Description" placeholder="Describe your dish..." value={description} onChangeText={setDescription} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
          <Input label="Price (Rs.)" placeholder="650" value={price} onChangeText={setPrice} keyboardType="numeric" />

          <View>
            <Text className="mb-2 text-sm font-semibold text-neutral-700">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {(categories ?? []).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  className={`rounded-full border px-3.5 py-2 ${categoryId === c.id ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}
                >
                  <Text className={`text-xs font-semibold ${categoryId === c.id ? "text-primary-600" : "text-neutral-600"}`}>{c.icon} {c.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Input label="Ingredients (comma-separated)" placeholder="Chicken, Rice, Spices" value={ingredients} onChangeText={setIngredients} />
          <Input label="Portion" placeholder="1 person" value={portion} onChangeText={setPortion} />
          <Input label="Preparation time (minutes)" placeholder="30" value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" />

          <View>
            <Text className="mb-2 text-sm font-semibold text-neutral-700">Spice level</Text>
            <View className="flex-row gap-2">
              {SPICE_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setSpiceLevel(level)}
                  className={`flex-1 items-center rounded-xl border py-2.5 ${spiceLevel === level ? "border-primary-500 bg-primary-50" : "border-neutral-200"}`}
                >
                  <Text className={`text-xs font-semibold capitalize ${spiceLevel === level ? "text-primary-600" : "text-neutral-600"}`}>{level}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <Button label="Add to Menu" fullWidth loading={submitting} onPress={onSubmit} />
    </SafeAreaView>
  );
}
