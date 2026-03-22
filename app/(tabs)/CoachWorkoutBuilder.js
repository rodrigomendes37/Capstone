import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRole } from "../../lib/utils/useRole";


export default function CoachWorkoutBuilder() {
  const { role, loadingRole } = useRole();

  const [title, setTitle] = useState("Lower Body Strength");
  const [exercises, setExercises] = useState([
    { name: "Back Squat", sets: "4", reps: "6" },
    { name: "RDL", sets: "3", reps: "8" },
  ]);

  const canAccess = useMemo(() => !loadingRole && role === "coach", [loadingRole, role]);

  if (loadingRole) return null;

  if (!canAccess) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Access restricted</Text>
        <Text>This page is for coaches only.</Text>
      </View>
    );
  }

  function updateExercise(i, patch) {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  function addExercise() {
    setExercises((prev) => [...prev, { name: "", sets: "3", reps: "10" }]);
  }

  function removeExercise(i) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveTemplate() {
    // Demo-only today: show payload
    const payload = { title, exercises };
    console.log("Workout Template:", payload);
    Alert.alert("Saved (Demo)", "Workout template is ready to publish.");
    // Later: insert into Supabase table workout_templates + link to team_id
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: "600" }}>Workout Builder</Text>

      <Text style={{ fontWeight: "600" }}>Workout Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
      />

      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 10 }}>
        Exercises
      </Text>

      {exercises.map((ex, i) => (
        <View key={i} style={{ borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }}>
          <Text style={{ fontWeight: "600" }}>Exercise {i + 1}</Text>

          <TextInput
            placeholder="Exercise name (e.g., Bench Press)"
            value={ex.name}
            onChangeText={(v) => updateExercise(i, { name: v })}
            style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ opacity: 0.7 }}>Sets</Text>
              <TextInput
                value={ex.sets}
                onChangeText={(v) => updateExercise(i, { sets: v })}
                keyboardType="number-pad"
                style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ opacity: 0.7 }}>Reps</Text>
              <TextInput
                value={ex.reps}
                onChangeText={(v) => updateExercise(i, { reps: v })}
                keyboardType="number-pad"
                style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
              />
            </View>
          </View>

          <TouchableOpacity onPress={() => removeExercise(i)} style={{ padding: 8 }}>
            <Text style={{ color: "crimson" }}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addExercise} style={{ borderWidth: 1, padding: 14, borderRadius: 12 }}>
        <Text style={{ textAlign: "center" }}>+ Add Exercise</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={saveTemplate} style={{ backgroundColor: "#6b46c1", padding: 14, borderRadius: 12 }}>
        <Text style={{ textAlign: "center", color: "white", fontWeight: "600" }}>
          Save Template
        </Text>
      </TouchableOpacity>

      <Text style={{ opacity: 0.7 }}>
        Next step: publish this template to a Team + date so athletes only fill weight/time.
      </Text>
    </ScrollView>
  );
}
