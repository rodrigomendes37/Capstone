// @ts-nocheck
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/services/supabase";
import { useRole } from "../../lib/utils/useRole";
import { useTeam } from "../../lib/utils/useTeam";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CheckInScreen() {
  const router = useRouter();
  const [hoursOfSleep, setHoursOfSleep] = useState("");
  const [sleepQuality, setSleepQuality] = useState(0);
  const [tirednessLevel, setTirednessLevel] = useState(0);
  const [sorenessLevel, setSorenessLevel] = useState(0);
  const [mood, setMood] = useState(50);
  const [comments, setComments] = useState("");

  const { role, loadingRole } = useRole();
  const { teamId, loadingTeam } = useTeam();
  const isCoach = role === "coach";

  const [coachLoading, setCoachLoading] = useState(false);
  const [athleteRows, setAthleteRows] = useState([]);
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [expandedAthlete, setExpandedAthlete] = useState(null);

  useEffect(() => {
    if (loadingRole || loadingTeam) return;
    if (!isCoach || !teamId) return;

    async function loadCoachView() {
      setCoachLoading(true);

      const todayString = getLocalDateString(new Date());

      // 1) athlete membership rows for this coach's team
      const { data: athletes, error: athletesErr } = await supabase
        .from("team_memberships")
        .select("user_id, role")
        .eq("team_id", teamId)
        .eq("role", "athlete");

      if (athletesErr) {
        console.log("Load athletes error:", athletesErr);
        setCoachLoading(false);
        return;
      }

      // 2) today's submitted check-ins for this team
      const { data: checkins, error: checkinsErr } = await supabase
        .from("checkins")
        .select(
          "id, user_id, created_at, team_id, date, hours_of_sleep, sleep_quality, tiredness, soreness, mood, comments"
        )
        .eq("team_id", teamId)
        .eq("date", todayString);

      if (checkinsErr) {
        console.log("Load checkins error:", checkinsErr);
        setCoachLoading(false);
        return;
      }

      setAthleteRows(athletes || []);
      setTodayCheckins(checkins || []);
      setCoachLoading(false);
    }

    loadCoachView();
  }, [loadingRole, loadingTeam, isCoach, teamId]);

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ------------------ Submit ------------------
  const handleSubmit = async () => {
    if (isCoach) return;
    if (!teamId) {
      Alert.alert("Missing team", "No team found for this athlete.");
      return;
    }

    console.log("HANDLE SUBMIT FIRED");

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) {
        console.log("Supabase getUser error:", userErr);
        return;
      }

      if (!user) {
        console.log("No user logged in!");
        return;
      }

      if (!user || !user.id) {
        console.log("No valid user for check-in!");
        Alert.alert("Login required", "Please log in first.");
        return;
      }

      const { error } = await supabase.from("checkins").insert({
        date: getLocalDateString(new Date()),
        hours_of_sleep: parseInt(hoursOfSleep) || 0,
        sleep_quality: parseInt(sleepQuality) || 0,
        tiredness: parseInt(tirednessLevel) || 0,
        soreness: parseInt(sorenessLevel) || 0,
        mood: parseInt(mood) || 50,
        comments: comments || "",
        user_id: user.id,
        team_id: teamId,
      });

      if (error) {
        console.log("Error inserting check-in:", error);
        Alert.alert("Check-in failed", JSON.stringify(error));
        return;
      }

      console.log("Check-in submitted!");
      router.replace("/"); // Navigate to Home after submit
    } catch (err) {
      console.log("Unexpected error:", err);
    }
  };

  // ------------------ Rating Buttons ------------------
  const RatingButtons = ({ value, onChange }) => (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <TouchableOpacity
          key={rating}
          onPress={() => onChange(rating)}
          style={[
            styles.ratingButton,
            value === rating ? styles.ratingSelected : styles.ratingUnselected,
          ]}
        >
          <Text
            style={
              value === rating
                ? styles.ratingTextSelected
                : styles.ratingTextUnselected
            }
          >
            {rating}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loadingRole || loadingTeam) return null;

  if (isCoach) {
    const submittedSet = new Set(
      (todayCheckins || []).map((c) => String(c.user_id)),
    );

    console.log("teamId:", teamId);
    console.log("athleteRows:", JSON.stringify(athleteRows, null, 2));
    console.log("todayCheckins:", JSON.stringify(todayCheckins, null, 2));
    console.log("submittedSet:", Array.from(submittedSet));

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Check-Ins</Text>
            <View style={{ width: 24 }} />
          </View>
          <Text style={styles.dateText}>{dateString}</Text>
        </View>

        <ScrollView style={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.label}>Daily Status (Athletes)</Text>
            <Text style={{ color: "#6B7280", marginBottom: 12 }}>
              Shows who submitted a check-in today.
            </Text>

            {coachLoading ? (
              <Text>Loading...</Text>
            ) : (
              athleteRows.map((a) => {
                const checkin = todayCheckins.find(
                  (c) => String(c.user_id) === String(a.user_id),
                );
                const ok = !!checkin;

                return (
                  <View
                    key={a.user_id}
                    style={{
                      backgroundColor: "white",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedAthlete((prev) =>
                          prev === a.user_id ? null : a.user_id,
                        )
                      }
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>
                        Athlete {String(a.user_id).slice(0, 8)}…
                      </Text>

                      <Text
                        style={{
                          fontWeight: "700",
                          color: ok ? "#22C55E" : "crimson",
                        }}
                      >
                        {ok ? "✅ Submitted" : "❌ Missing"}
                      </Text>
                    </TouchableOpacity>

                    {expandedAthlete === a.user_id && checkin && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={{ color: "#374151", marginBottom: 4 }}>
                          Sleep: {checkin.hours_of_sleep} hrs
                        </Text>
                        <Text style={{ color: "#374151", marginBottom: 4 }}>
                          Sleep Quality: {checkin.sleep_quality}
                        </Text>
                        <Text style={{ color: "#374151", marginBottom: 4 }}>
                          Tiredness: {checkin.tiredness}
                        </Text>
                        <Text style={{ color: "#374151", marginBottom: 4 }}>
                          Soreness: {checkin.soreness}
                        </Text>
                        <Text style={{ color: "#374151", marginBottom: 4 }}>
                          Mood: {checkin.mood}
                        </Text>
                        <Text style={{ color: "#374151" }}>
                          Comments: {checkin.comments || "None"}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {!coachLoading && athleteRows.length === 0 && (
              <Text style={{ color: "#6B7280" }}>
                No athletes found on this team yet.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Check-In</Text>
          <View style={{ width: 24 }} /> {/* placeholder */}
        </View>
        <Text style={styles.dateText}>{dateString}</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Hours of Sleep */}
        <View style={styles.section}>
          <Text style={styles.label}>Hours of Sleep</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={hoursOfSleep}
            onChangeText={setHoursOfSleep}
            placeholder="e.g. 7"
          />
        </View>

        {/* Sleep Quality */}
        <View style={styles.section}>
          <Text style={styles.label}>Sleep Quality</Text>
          <RatingButtons value={sleepQuality} onChange={setSleepQuality} />
        </View>

        {/* Tiredness */}
        <View style={styles.section}>
          <Text style={styles.label}>Tiredness</Text>
          <RatingButtons value={tirednessLevel} onChange={setTirednessLevel} />
        </View>

        {/* Soreness */}
        <View style={styles.section}>
          <Text style={styles.label}>Soreness</Text>
          <RatingButtons value={sorenessLevel} onChange={setSorenessLevel} />
        </View>

        {/* Mood */}
        <View style={styles.section}>
          <Text style={styles.label}>Mood</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={mood}
            onValueChange={setMood}
          />
          <Text style={styles.moodText}>{mood}</Text>
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.label}>Comments</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={comments}
            onChangeText={setComments}
            placeholder="Any notes for today?"
          />
        </View>

        {/* Submit */}
        <View style={styles.submitContainer}>
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 56,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  dateText: { textAlign: "center", color: "#6B7280", marginTop: 8 },
  scrollContent: { padding: 16 },
  section: { marginBottom: 24 },
  label: { marginBottom: 8, fontSize: 16, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFF",
  },
  ratingContainer: { flexDirection: "row" },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  ratingSelected: {
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  ratingUnselected: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  ratingTextSelected: { color: "#FFF", fontWeight: "bold" },
  ratingTextUnselected: { color: "#374151", fontWeight: "bold" },
  slider: { flex: 1 },
  moodText: { textAlign: "center", marginTop: 8, color: "#6B7280" },
  submitContainer: { marginTop: 16, alignItems: "center" },
  submitButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  submitText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
