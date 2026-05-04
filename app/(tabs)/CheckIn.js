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
import { BarChart } from "react-native-gifted-charts";
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
  const [athleteNames, setAthleteNames] = useState({});

  const [alreadyCheckedInToday, setAlreadyCheckedInToday] = useState(false);
  const [loadingAthleteCheckin, setLoadingAthleteCheckin] = useState(false);

  const [trendCheckins, setTrendCheckins] = useState([]);

  useEffect(() => {
    if (loadingRole || loadingTeam) return;
    if (!isCoach || !teamId) return;

    async function loadCoachView() {
      setCoachLoading(true);

      // Load the athletes assigned to this coach's team
      const { data: athletes, error: athletesErr } = await supabase
        .from("team_memberships")
        .select("user_id, role")
        .eq("team_id", teamId)
        .eq("role", "athlete");

      if (athletesErr) {
        setAthleteRows([]);
        setTodayCheckins([]);
        setTrendCheckins([]);
        setAthleteNames({});
        setCoachLoading(false);
        return;
      }

      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - 6);

      const startString = getLocalDateString(startDate);
      const todayString = getLocalDateString(today);

      // Pull the last week of check-ins for the coach trend view.
      const { data: checkins, error: checkinsErr } = await supabase
        .from("checkins")
        .select(
          "id, user_id, created_at, team_id, date, hours_of_sleep, sleep_quality, tiredness, soreness, mood, comments",
        )
        .eq("team_id", teamId)
        .gte("date", startString)
        .lte("date", todayString)
        .order("date", { ascending: true });

      if (checkinsErr) {
        setTodayCheckins([]);
        setTrendCheckins([]);
        setAthleteNames({});
        setCoachLoading(false);
        return;
      }

      const safeAthletes = athletes || [];
      const safeCheckins = checkins || [];

      setAthleteRows(safeAthletes);
      setTrendCheckins(safeCheckins);

      const todayOnly = safeCheckins.filter((c) => c.date === todayString);
      setTodayCheckins(todayOnly);

      const athleteIds = [
        ...new Set(safeAthletes.map((a) => a.user_id).filter(Boolean)),
      ];

      if (athleteIds.length > 0) {
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", athleteIds);

        if (profileErr) {
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

      setCoachLoading(false);
    }

    loadCoachView();
  }, [loadingRole, loadingTeam, isCoach, teamId]);

  useEffect(() => {
    if (loadingRole || loadingTeam) return;
    if (isCoach || !teamId) return;

    async function loadAthleteTodayCheckin() {
      setLoadingAthleteCheckin(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setAlreadyCheckedInToday(false);
        setLoadingAthleteCheckin(false);
        return;
      }

      const todayString = getLocalDateString(new Date());

      const { data, error } = await supabase
        .from("checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", todayString)
        .maybeSingle();

      if (error) {
        setAlreadyCheckedInToday(false);
      } else {
        setAlreadyCheckedInToday(!!data);
      }

      setLoadingAthleteCheckin(false);
    }

    loadAthleteTodayCheckin();
  }, [loadingRole, loadingTeam, isCoach, teamId]);

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async () => {
    if (isCoach) return;
    if (!teamId) {
      Alert.alert("Missing team", "No team found for this athlete.");
      return;
    }

    if (alreadyCheckedInToday) {
      Alert.alert(
        "Already submitted",
        "Your check-in for today has already been completed."
      );
      return;
    }

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user?.id) {
        Alert.alert("Login required", "Please log in first.");
        return;
      }

      const { error } = await supabase.from("checkins").upsert(
        {
          date: getLocalDateString(new Date()),
          hours_of_sleep: parseInt(hoursOfSleep) || 0,
          sleep_quality: sleepQuality || 0,
          tiredness: tirednessLevel || 0,
          soreness: sorenessLevel || 0,
          mood: mood || 50,
          comments: comments || "",
          user_id: user.id,
          team_id: teamId,
        },
        {
          onConflict: "user_id,date",
        },
      );

      if (error) {
        Alert.alert("Check-in failed", "Could not save the check-in.");
        return;
      }

      setAlreadyCheckedInToday(true);
      Alert.alert("Saved", "Your check-in for today has been recorded.");
      router.replace("/");
    } catch {
      Alert.alert("Check-in failed", "Could not save the check-in.");
    }
  };

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

  function getPast7Days() {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      days.push({
        full: getLocalDateString(d),
        short: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }

    return days;
  }

  function buildBarDataForAthlete(checkins, athleteId, metricKey, barColor) {
    const days = getPast7Days();

    return days.map((day) => {
      const entry = checkins.find(
        (c) => String(c.user_id) === String(athleteId) && c.date === day.full,
      );

      return {
        value: entry?.[metricKey] ?? 0,
        label: day.short,
        frontColor: barColor,
      };
    });
  }

  if (loadingRole || loadingTeam) return null;

  if (!teamId && !isCoach) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
            Team assignment pending
          </Text>
          <Text style={{ textAlign: "center", color: "#6B7280" }}>
            Your account was created successfully, but you have not been
            assigned to a team yet. Please contact your coach or administrator.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isCoach) {  
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
            <Text style={styles.label}>Player Trends (Last 7 Days)</Text>
            <Text style={{ color: "#6B7280", marginBottom: 12 }}>
              Each athlete has their own sleep and tiredness chart.
            </Text>

            {athleteRows.length === 0 ? (
              <Text style={{ color: "#6B7280" }}>
                No athletes found on this team yet.
              </Text>
            ) : (
              athleteRows.map((athlete) => {
                const athleteName =
                  athleteNames[athlete.user_id] ||
                  `Athlete ${String(athlete.user_id).slice(0, 8)}…`;

                const sleepBarData = buildBarDataForAthlete(
                  trendCheckins,
                  athlete.user_id,
                  "hours_of_sleep",
                  "#3B82F6",
                );

                const tirednessBarData = buildBarDataForAthlete(
                  trendCheckins,
                  athlete.user_id,
                  "tiredness",
                  "#F59E0B",
                );

                return (
                  <View
                    key={`trend-${athlete.user_id}`}
                    style={{
                      backgroundColor: "white",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 12 }}>
                      {athleteName}
                    </Text>

                    <Text style={{ color: "#374151", fontWeight: "600", marginBottom: 8 }}>
                      Sleep Hours
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <BarChart
                        data={sleepBarData}
                        barWidth={22}
                        spacing={18}
                        roundedTop
                        roundedBottom
                        noOfSections={6}
                        maxValue={12}
                        yAxisTextStyle={{ color: "#6B7280" }}
                        xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
                        rulesColor="#E5E7EB"
                        width={360}
                      />
                    </ScrollView>

                    <Text
                      style={{
                        color: "#374151",
                        fontWeight: "600",
                        marginTop: 16,
                        marginBottom: 8,
                      }}
                    >
                      Tiredness
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <BarChart
                        data={tirednessBarData}
                        barWidth={22}
                        spacing={18}
                        roundedTop
                        roundedBottom
                        noOfSections={5}
                        maxValue={5}
                        yAxisTextStyle={{ color: "#6B7280" }}
                        xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
                        rulesColor="#E5E7EB"
                        width={360}
                      />
                    </ScrollView>
                  </View>
                );
              })
            )}
          </View>

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
                        {athleteNames[a.user_id] ||
                          `Athlete ${String(a.user_id).slice(0, 8)}…`}
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
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Check-In</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.dateText}>{dateString}</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
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

        <View style={styles.section}>
          <Text style={styles.label}>Sleep Quality</Text>
          <RatingButtons value={sleepQuality} onChange={setSleepQuality} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tiredness</Text>
          <RatingButtons value={tirednessLevel} onChange={setTirednessLevel} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Soreness</Text>
          <RatingButtons value={sorenessLevel} onChange={setSorenessLevel} />
        </View>

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

        <View style={styles.submitContainer}>
          {loadingAthleteCheckin ? (
            <Text style={{ color: "#6B7280" }}>Checking today's status...</Text>
          ) : alreadyCheckedInToday ? (
            <View
              style={[
                styles.submitButton,
                { backgroundColor: "#9CA3AF" },
              ]}
            >
              <Text style={styles.submitText}>Check-In Already Submitted Today</Text>
            </View>
          ) : (
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          )}
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
