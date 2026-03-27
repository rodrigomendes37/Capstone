import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Login screen */}
        <Stack.Screen name="login" />

        {/* Tabs group */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}



