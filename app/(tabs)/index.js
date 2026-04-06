// @ts-nocheck
import { useRouter } from "expo-router";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/services/supabase";
import { useRole } from "../../lib/utils/useRole";
import { useTeam } from "../../lib/utils/useTeam";
import ProtectedRoute from "../components/ProtectedRoute";

// Actual HomeScreen component
function HomeScreen() {
  const router = useRouter();
  const dateString = new Date().toDateString();
  const { role, loadingRole } = useRole();
  const { teamId, loadingTeam } = useTeam();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [nextWorkout, setNextWorkout] = useState(null);
  const [homeLoading, setHomeLoading] = useState(true);

  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    async function loadHomeData() {
      if (loadingRole || loadingTeam) return;

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setUpcomingEvents([]);
        setNextWorkout(null);
        setHomeLoading(false);
        return;
      }

      const today = getLocalDateString(new Date());

      // Calendar events: own personal + team events
      let eventsQuery = supabase
        .from("calendar_events")
        .select("*")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .order("hour", { ascending: true });

      if (teamId) {
        eventsQuery = eventsQuery.or(
          `created_by.eq.${user.id},and(scope.eq.team,team_id.eq.${teamId})`,
        );
      } else {
        eventsQuery = eventsQuery.eq("created_by", user.id);
      }

      const { data: eventRows, error: eventsErr } = await eventsQuery.limit(3);

      if (eventsErr) {
        setUpcomingEvents([]);
      } else {
        setUpcomingEvents(eventRows || []);
      }

      // Next workout for the team
      if (teamId) {
        const { data: workoutRow, error: workoutErr } = await supabase
          .from("workout_assignments")
          .select("*")
          .eq("team_id", teamId)
          .gte("assigned_date", today)
          .order("assigned_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (workoutErr) {
          setNextWorkout(null);
        } else {
          setNextWorkout(workoutRow || null);
        }
      } else {
        setNextWorkout(null);
      }

      setHomeLoading(false);
    }

    loadHomeData();
  }, [loadingRole, loadingTeam, teamId, role]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <Text style={styles.headerSubtitle}>
            {role
              ? `Logged in as ${role}`
              : "Welcome back! Choose an option below"}
          </Text>
        </View>

        {/* CALENDAR CARD */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(tabs)/Calendar")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconBlue}>
              <Calendar size={28} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Calendar</Text>
              <Text style={styles.cardSubtitle}>{dateString}</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
          <View style={styles.eventsContainer}>
            {homeLoading ? (
              <Text style={styles.cardSubtitle}>Loading...</Text>
            ) : upcomingEvents.length === 0 ? (
              <Text style={styles.cardSubtitle}>No upcoming events</Text>
            ) : (
              upcomingEvents.map((event) => (
                <View key={event.id} style={styles.eventRow}>
                  <Text style={styles.eventTime}>{event.time_label}</Text>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                </View>
              ))
            )}
          </View>
        </TouchableOpacity>

        {/* CHECK-IN CARD */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(tabs)/CheckIn")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconGreen}>
              <ClipboardCheck size={28} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Check-in</Text>
              <Text style={styles.cardSubtitle}>Daily progress tracking</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* TRAINING LOG CARD */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(tabs)/TrainingLog")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconPurple}>
              <BookOpen size={28} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Training Log</Text>
              <Text style={styles.cardSubtitle}>
                Track your workouts and sessions
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
          <View style={styles.workoutBox}>
            <Text style={styles.workoutBoxTitle}>Next Workout</Text>
            {homeLoading ? (
              <Text style={styles.workoutName}>Loading...</Text>
            ) : nextWorkout ? (
              <>
                <Text style={styles.workoutName}>{nextWorkout.title}</Text>
                <Text style={styles.workoutTime}>
                  {nextWorkout.assigned_date}
                </Text>
              </>
            ) : (
              <Text style={styles.workoutName}>No upcoming workout</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
          style={{
            alignSelf: "flex-end",
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            marginBottom: 10,
          }}
        >
          <Text>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Wrap HomeScreen with ProtectedRoute
export default function HomeScreenWrapper() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}

// -------- STYLES ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 20 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "600" },
  headerSubtitle: { color: "#6B7280" },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconBlue: {
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  iconGreen: {
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  iconPurple: {
    backgroundColor: "#F5F3FF",
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: "500" },
  cardSubtitle: { color: "#6B7280", fontSize: 13 },
  eventsContainer: {
    marginLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#BFDBFE",
    paddingLeft: 10,
  },
  eventRow: { flexDirection: "row", marginBottom: 6 },
  eventTime: { color: "#6B7280", width: 110, fontSize: 12 },
  eventTitle: { fontSize: 14 },
  workoutBox: {
    backgroundColor: "#F5F3FF",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  workoutBoxTitle: { color: "#7C3AED", fontSize: 12 },
  workoutName: { fontSize: 15, marginTop: 2 },
  workoutTime: { fontSize: 12, color: "#6B7280" },
  statsCard: {
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  statsTitle: { color: "white", fontSize: 16, marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statNumber: { fontSize: 20, color: "white" },
  statLabel: { color: "#D1D5DB", fontSize: 11 },
});
