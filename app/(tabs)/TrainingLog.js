// @ts-nocheck
import { useRouter } from "expo-router"; // <-- corrected
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRole } from "../../lib/utils/useRole";

// Mock exercises for today
const todaysWorkout = [
  { id: "1", name: "Barbell Back Squat", sets: 4, reps: 8 },
  { id: "2", name: "Romanian Deadlift", sets: 3, reps: 10 },
  { id: "3", name: "Leg Press", sets: 3, reps: 12 },
  { id: "4", name: "Walking Lunges", sets: 3, reps: 20 },
  { id: "5", name: "Leg Curl", sets: 3, reps: 12 },
  { id: "6", name: "Calf Raises", sets: 4, reps: 15 },
];

export default function TrainingLog() {
  const router = useRouter(); // <-- initialize router here

  const { role, loadingRole } = useRole();
  if (loadingRole) return null;

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [weights, setWeights] = useState(() => {
    const saved = null; // Replace with AsyncStorage or local persistence if needed
    if (saved) return saved;
    return todaysWorkout.reduce((acc, ex) => {
      acc[ex.id] = Array(ex.sets).fill("");
      return acc;
    }, {});
  });

  if (role === "coach") {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Training Log (Coach)</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.dateText}>{dateString}</Text>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <View style={styles.exerciseCard}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>Coach View</Text>
            <Text style={{ color: "#6B7280", marginTop: 6 }}>
              Coaches create workout templates (exercises + sets + reps).
              Athletes will only input weight/time for each set.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: "#6b46c1" }]}
            onPress={() => router.push("/(tabs)/CoachWorkoutBuilder")}
          >
            <Text style={styles.submitText}>
              Create / Edit Workout Template
            </Text>
          </TouchableOpacity>

          <View style={styles.exerciseCard}>
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>
              Demo Preview (Today)
            </Text>
            {todaysWorkout.map((ex) => (
              <Text key={ex.id} style={{ color: "#374151", marginBottom: 4 }}>
                • {ex.name} — {ex.sets}×{ex.reps}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const handleWeightChange = (exerciseId, setIndex, value) => {
    setWeights((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((w, i) =>
        i === setIndex ? value : w,
      ),
    }));
  };

  const handleSubmit = () => {
    console.log("Submitted weights:", weights);
    router.back(); // <-- navigate back
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Training Log</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.dateText}>{dateString}</Text>

      <ScrollView style={styles.scrollContent}>
        {todaysWorkout.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseSets}>
              {exercise.sets} sets × {exercise.reps} reps
            </Text>

            {Array.from({ length: exercise.sets }).map((_, i) => (
              <View key={i} style={styles.setRow}>
                <Text style={styles.setLabel}>Set {i + 1}</Text>
                <TextInput
                  style={styles.input}
                  value={weights[exercise.id][i]}
                  onChangeText={(text) =>
                    handleWeightChange(exercise.id, i, text)
                  }
                  placeholder="Weight"
                  keyboardType="numeric"
                />
                <Text style={styles.lbs}>lbs</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingTop: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  dateText: {
    paddingHorizontal: 16,
    marginBottom: 16,
    color: "#6B7280",
    fontSize: 16,
  },
  scrollContent: { paddingHorizontal: 16 },
  exerciseCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  exerciseName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  exerciseSets: { fontSize: 12, color: "#6B7280", marginBottom: 8 },
  setRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  setLabel: { width: 60, fontSize: 14 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  lbs: { width: 30, fontSize: 14, color: "#6B7280" },
  submitButton: {
    backgroundColor: "#22C55E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  submitText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
