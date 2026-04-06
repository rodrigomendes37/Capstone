import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { scheduleDailyCheckInReminder } from "../lib/services/notifications";

export default function RootLayout() {

  useEffect(() => {
    scheduleDailyCheckInReminder().catch((err) => {
      console.log("Daily reminder scheduling error:", err);
    });
  }, []);

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



