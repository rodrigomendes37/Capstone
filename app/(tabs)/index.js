// @ts-nocheck
import { useRouter } from "expo-router";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/services/supabase";
import { useRole } from "../../lib/utils/useRole";
import ProtectedRoute from "../components/ProtectedRoute";

// Temporary demo data
const todaysEvents = [
  { time: "8:00 AM", title: "Morning Run" },
  { time: "3:00 PM", title: "Team Training" },
];

const todaysWorkout = { title: "Strength Training", time: "5:00 PM" };

// Actual HomeScreen component
function HomeScreen() {
  const router = useRouter();
  const dateString = new Date().toDateString();
  const { role, loadingRole } = useRole();

  return (
    <View style={styles.container}>
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

        {/*COACH DASHBOARD*/}
        {!loadingRole && role === "coach" && (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/(tabs)/CoachDashboard")}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconPurple}>
                  <ClipboardCheck size={28} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Coach Dashboard</Text>
                  <Text style={styles.cardSubtitle}>
                    Review athlete check-ins & logs
                  </Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
        )}

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
            {todaysEvents.map((event, index) => (
              <View key={index} style={styles.eventRow}>
                <Text style={styles.eventTime}>{event.time}</Text>
                <Text style={styles.eventTitle}>{event.title}</Text>
              </View>
            ))}
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
            <Text style={styles.workoutBoxTitle}>Today's Workout</Text>
            <Text style={styles.workoutName}>{todaysWorkout.title}</Text>
            <Text style={styles.workoutTime}>
              Starts at {todaysWorkout.time}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await supabase.auth.signOut();
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

        {/* WEEKLY STATS */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>This Week</Text>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View>
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Goals Met</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
  eventTime: { color: "#6B7280", width: 70, fontSize: 12 },
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
