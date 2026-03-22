import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useRole } from "../../lib/utils/useRole";

export default function CoachDashboard() {
  const router = useRouter();
  const { role, loadingRole } = useRole();

  if (loadingRole) return null;

  // Basic permission gate
  if (role !== "coach") {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Access restricted</Text>
        <Text>This page is for coaches only.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: "600" }}>Coach Dashboard</Text>
      <Text style={{ opacity: 0.7 }}>
        Review athlete data and publish workouts/schedule updates.
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/(tabs)/CoachWorkoutBuilder")}
        style={{ borderWidth: 1, padding: 14, borderRadius: 12 }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          Create Workout Template
        </Text>
        <Text style={{ opacity: 0.7 }}>
          Pick exercises, sets, reps. Athletes fill weight/time.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/(tabs)/Schedule")}
        style={{ borderWidth: 1, padding: 14, borderRadius: 12 }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          Add to Team Schedule
        </Text>
        <Text style={{ opacity: 0.7 }}>
          Add events visible to all athletes.
        </Text>
      </TouchableOpacity>

      <View style={{ marginTop: 10, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Team Overview</Text>
        <Text style={{ opacity: 0.7 }}>
          (Demo for today) Athlete list + check-in/log summaries will appear here
          once Teams are implemented.
        </Text>
      </View>
    </View>
  );
}
