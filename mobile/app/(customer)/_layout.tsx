import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="search" options={{ animation: "fade" }} />
      <Stack.Screen name="kitchen/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="food/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="checkout" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="order/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="chat/[orderId]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="address/add" options={{ presentation: "modal" }} />
      <Stack.Screen name="addresses" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="my-reviews" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="categories" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="review/[orderId]" options={{ presentation: "modal" }} />
    </Stack>
  );
}
