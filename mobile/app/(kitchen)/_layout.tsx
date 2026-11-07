import { Stack } from "expo-router";

export default function KitchenLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="order/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="chat/[orderId]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="menu/add" options={{ presentation: "modal" }} />
      <Stack.Screen name="menu/[id]/edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="business-hours" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="kitchen-profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="payment-details" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="subscription" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="reviews" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
