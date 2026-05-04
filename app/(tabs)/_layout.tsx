import { Tabs } from "expo-router";
import ProtectedRoute from "../components/ProtectedRoute";

export default function TabsLayout() {
  return (
    <ProtectedRoute>
      {/* All main app tabs require an active Supabase session. */}
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="CheckIn" options={{ title: "Check-In" }} />
        <Tabs.Screen name="TrainingLog" options={{ title: "Training Log" }} />
        <Tabs.Screen name="Calendar" options={{ title: "Calendar" }} />
      </Tabs>
    </ProtectedRoute>
  );
}
