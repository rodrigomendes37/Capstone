import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Login screen */}
      <Stack.Screen name="login" />

      {/* Tabs group */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}



