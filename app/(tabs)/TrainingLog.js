// @ts-nocheck
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/services/supabase";
import { useRole } from "../../lib/utils/useRole";
import { useTeam } from "../../lib/utils/useTeam";
import { SafeAreaView } from "react-native-safe-area-context";
import TimePickerField from "../components/TimePickerField";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TrainingLog() {
  const router = useRouter();

  const { role, loadingRole } = useRole();
  const { teamId, loadingTeam } = useTeam();
  const isCoach = role === "coach";

  const today = new Date();
  const todayString = getLocalDateString(today);
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [assignment, setAssignment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [nextAssignment, setNextAssignment] = useState(null);

  // coach form state
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedDate, setAssignedDate] = useState(todayString);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [exercises, setExercises] = useState([
    { name: "", sets: "", reps: "" },
  ]);

  // athlete submission state
  const [submission, setSubmission] = useState({});
  const [expandedAthlete, setExpandedAthlete] = useState(null);
  const [athleteNames, setAthleteNames] = useState({});

  async function loadTrainingData() {
    if (!teamId) return;

    setLoadingData(true);
    setAssignment(null);
    setLogs([]);
    setNextAssignment(null);
    setSubmission({});

    const { data: assignmentData, error: assignmentErr } = await supabase
      .from("workout_assignments")
      .select("*")
      .eq("team_id", teamId)
      .eq("assigned_date", todayString)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("todayString:", todayString);
    console.log("assignmentData:", assignmentData);

    if (assignmentErr) {
      console.log("Load assignment error:", assignmentErr);
      setAssignment(null);
      setLogs([]);
      setAthleteNames({});
      setLoadingData(false);
      return;
    }

    setAssignment(assignmentData || null);

    if (assignmentData) {
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("assignment_id", assignmentData.id);

      if (logsErr) {
        console.log("Load workout logs error:", logsErr);
        setLogs([]);
        setAthleteNames({});
      } else {
        const safeLogs = logsData || [];
        setLogs(safeLogs);

        const athleteIds = [
          ...new Set(safeLogs.map((log) => log.athlete_user_id).filter(Boolean)),
        ];

        if (athleteIds.length > 0) {
          const { data: profileData, error: profileErr } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", athleteIds);

          if (profileErr) {
            console.log("Load athlete profiles error:", profileErr);
            setAthleteNames({});
          } else {
            const nameMap = {};
            for (const profile of profileData || []) {
              const fullName =
                `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

              nameMap[profile.user_id] =
                fullName || `Athlete ${String(profile.user_id).slice(0, 8)}…`;
            }
            setAthleteNames(nameMap);
          }
        } else {
          setAthleteNames({});
        }
      }
    }

    const { data: nextData, error: nextErr } = await supabase
      .from("workout_assignments")
      .select("*")
      .eq("team_id", teamId)
      .gt("assigned_date", todayString)
      .order("assigned_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextErr) {
      console.log("Load next assignment error:", nextErr);
      setNextAssignment(null);
    } else {
      setNextAssignment(nextData || null);
    }

    setLoadingData(false);
  }

  useEffect(() => {
    if (loadingRole || loadingTeam) return;
    if (!teamId) return;
    loadTrainingData();
  }, [loadingRole, loadingTeam, teamId, role]);

  function updateExercise(i, patch) {
    setExercises((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    );
  }

  function addExercise() {
    setExercises((prev) => [...prev, { name: "", sets: "", reps: "" }]);
  }

  function removeExercise(i) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSubmission(exerciseIndex, setIndex, value) {
    setSubmission((prev) => ({
      ...prev,
      [exerciseIndex]: {
        ...(prev[exerciseIndex] || {}),
        [setIndex]: value,
      },
    }));
  }

  async function saveAssignment() {
    if (!teamId) return;

    const startHour = Number(startTime.split(":")[0]);
    const startMinute = Number(startTime.split(":")[1] || 0);

    const endHour = Number(endTime.split(":")[0]);
    const endMinute = Number(endTime.split(":")[1] || 0);

    const duration = endHour + endMinute / 60 - (startHour + startMinute / 60);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return;

    // 1) Save workout assignment
    const { data: assignmentInsert, error: assignmentError } = await supabase
      .from("workout_assignments")
      .insert({
        team_id: teamId,
        created_by: user.id,
        title: title.trim() || "Workout",
        assigned_date: assignedDate,
        notes,
        exercises,
      })
      .select()
      .single();

    if (assignmentError) {
      console.log("Save assignment error:", assignmentError);
      Alert.alert("Save failed", "Could not save the workout assignment.");
      return;
    }

    // 2) Create matching calendar event for the team
    const { error: calendarError } = await supabase
      .from("calendar_events")
      .insert({
        assignment_id: assignmentInsert.id,
        team_id: teamId,
        created_by: user.id,
        scope: "team",
        title: title.trim() || "Workout",
        event_date: assignedDate,
        time_label: `${startTime} - ${endTime}`,
        hour: startHour,
        duration: duration,
      });

    if (calendarError) {
      console.log("Save calendar event error:", calendarError);
      Alert.alert("Save failed", "Could not add the workout to the calendar.");
      return;
    }

    Alert.alert("Success", "Workout assigned successfully.");
    await loadTrainingData();
    router.replace("/");
  }

  async function deleteAssignment() {
    if (!assignment?.id) return;

    const { error } = await supabase
      .from("workout_assignments")
      .delete()
      .eq("id", assignment.id);

    if (error) {
      console.log("Delete assignment error:", error);
      return;
    }

    Alert.alert("Deleted", "Workout assignment deleted successfully.");
    setAssignment(null);
    setLogs([]);
    setAthleteNames({});
    await loadTrainingData();
    router.replace("/");
  }

  async function submitWorkoutLog() {
    if (!assignment) return;

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return;

    const { error } = await supabase.from("workout_logs").upsert(
      {
        assignment_id: assignment.id,
        athlete_user_id: user.id,
        submission,
      },
      { onConflict: "assignment_id,athlete_user_id" },
    );

    if (error) {
      console.log("Submit workout log error:", error);
      return;
    }

    await loadTrainingData();
    router.replace("/");
  }

  if (loadingRole || loadingTeam || loadingData) return null;

  if (!teamId && !isCoach) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
            Team assignment pending
          </Text>
          <Text style={{ textAlign: "center", color: "#6B7280" }}>
            Your account was created successfully, but you have not been assigned to a team yet.
            Please contact your coach or administrator.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isCoach) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Training Log</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.dateText}>{dateString}</Text>

          <View style={styles.exerciseCard}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
              Coach View
            </Text>

            <TextInput
              placeholder="Workout title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              placeholder="Assigned date (YYYY-MM-DD)"
              value={assignedDate}
              onChangeText={setAssignedDate}
              style={[styles.input, { marginTop: 10 }]}
            />

            <TimePickerField
              label="Start Time"
              value={startTime}
              onChange={setStartTime}
            />

            <TimePickerField
              label="End Time"
              value={endTime}
              onChange={setEndTime}
            />

            <TextInput
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[styles.input, { marginTop: 10, height: 80 }]}
            />
          </View>

          <View style={styles.exerciseCard}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
              Exercises
            </Text>

            {exercises.map((ex, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <TextInput
                  placeholder="Exercise name"
                  value={ex.name}
                  onChangeText={(v) => updateExercise(i, { name: v })}
                  style={styles.input}
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <TextInput
                    placeholder="Sets"
                    value={ex.sets}
                    onChangeText={(v) => updateExercise(i, { sets: v })}
                    keyboardType="numeric"
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TextInput
                    placeholder="Reps"
                    value={ex.reps}
                    onChangeText={(v) => updateExercise(i, { reps: v })}
                    keyboardType="numeric"
                    style={[styles.input, { flex: 1 }]}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => removeExercise(i)}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ color: "crimson" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.submitButton} onPress={addExercise}>
              <Text style={styles.submitText}>Add Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, { marginTop: 10 }]}
              onPress={saveAssignment}
            >
              <Text style={styles.submitText}>Save Workout Assignment</Text>
            </TouchableOpacity>

            {assignment && (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { marginTop: 10, backgroundColor: "#DC2626" },
                ]}
                onPress={deleteAssignment}
              >
                <Text style={styles.submitText}>
                  Delete Today&apos;s Assignment
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.exerciseCard}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
              Athlete Submissions for Today
            </Text>

            {logs.length === 0 ? (
              <Text style={{ color: "#6B7280" }}>
                No athlete submissions yet.
              </Text>
            ) : (
              logs.map((log) => (
                <View
                  key={log.id}
                  style={{
                    marginBottom: 12,
                    backgroundColor: "white",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedAthlete((prev) =>
                        prev === log.id ? null : log.id,
                      )
                    }
                  >
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      {athleteNames[log.athlete_user_id] || `Athlete ${String(log.athlete_user_id).slice(0, 8)}…`}
                    </Text>
                    <Text style={{ color: "#6B7280", marginTop: 4 }}>
                      Tap to {expandedAthlete === log.id ? "hide" : "view"}{" "}
                      submission
                    </Text>
                  </TouchableOpacity>

                  {expandedAthlete === log.id && (
                    <View style={{ marginTop: 10 }}>
                      {(assignment?.exercises || []).map(
                        (exercise, exerciseIndex) => (
                          <View key={exerciseIndex} style={{ marginBottom: 10 }}>
                            <Text style={{ fontWeight: "600" }}>
                              {exercise.name}
                            </Text>
                            <Text style={{ color: "#6B7280", marginBottom: 4 }}>
                              {exercise.sets} sets × {exercise.reps} reps
                            </Text>

                            {Array.from({
                              length: Number(exercise.sets) || 0,
                            }).map((_, setIndex) => (
                              <Text key={setIndex} style={{ color: "#374151" }}>
                                Set {setIndex + 1}:{" "}
                                {log.submission?.[exerciseIndex]?.[setIndex] ||
                                  "-"}
                              </Text>
                            ))}
                          </View>
                        ),
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Training Log</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.dateText}>{dateString}</Text>
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#6B7280", marginBottom: 8 }}>
            No workout assigned for today.
          </Text>

          {nextAssignment && (
            <Text style={{ color: "#374151" }}>
              Next workout: {nextAssignment.title} on{" "}
              {new Date(
                nextAssignment.assigned_date + "T00:00:00",
              ).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const todaysWorkout = assignment.exercises || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Training Log</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.dateText}>{dateString}</Text>

      <ScrollView style={styles.scrollContent}>
        {todaysWorkout.map((exercise, exerciseIndex) => (
          <View key={exerciseIndex} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseSets}>
              {exercise.sets} sets × {exercise.reps} reps
            </Text>

            {Array.from({ length: Number(exercise.sets) || 0 }).map((_, i) => (
              <View key={i} style={styles.setRow}>
                <Text style={styles.setLabel}>Set {i + 1}</Text>
                <TextInput
                  style={styles.input}
                  value={submission?.[exerciseIndex]?.[i] || ""}
                  onChangeText={(text) =>
                    updateSubmission(exerciseIndex, i, text)
                  }
                  placeholder="Weight / Time"
                  keyboardType="numeric"
                />
                <Text style={styles.lbs}>lbs</Text>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitWorkoutLog}
        >
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    paddingTop: 8,
    minHeight: 56,
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
