// @ts-nocheck
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router"; // <-- added

export default function CalendarScreen() {
  const router = useRouter(); // <-- added
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Mock events
  const events = {
    12: [
      { time: "09:00 AM", title: "Morning Workout", hour: 9, duration: 1 },
      { time: "02:00 PM", title: "Team Meeting", hour: 14, duration: 1 },
    ],
    15: [
      { time: "10:00 AM", title: "Cardio Session", hour: 10, duration: 1.5 },
    ],
    18: [
      { time: "08:00 AM", title: "Yoga Class", hour: 8, duration: 1 },
      { time: "05:30 PM", title: "Strength Training", hour: 17, duration: 2 },
    ],
    22: [
      { time: "07:00 AM", title: "Running", hour: 7, duration: 0.5 },
      { time: "12:00 PM", title: "Lunch & Learn", hour: 12, duration: 1 },
      { time: "04:00 PM", title: "HIIT Workout", hour: 16, duration: 1 },
    ],
    25: [
      { time: "09:30 AM", title: "Personal Training", hour: 9, duration: 1 },
    ],
  };

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calendar calculations
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const lastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  // Hours for day view
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  // ---------------- MONTHLY VIEW ----------------
  if (!selectedDay) {
    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}> {/* <-- updated */}
            <ArrowLeft size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <ChevronLeft size={24} />
          </TouchableOpacity>
          <Text style={styles.monthName}>{monthName}</Text>
          <TouchableOpacity onPress={goToNextMonth}>
            <ChevronRight size={24} />
          </TouchableOpacity>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdays}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Text key={day} style={styles.weekdayText}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Days */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const hasEvents = day && events[day];
            const isToday = day === 12; // mock today
            return (
              <TouchableOpacity
                key={index}
                onPress={() => day && setSelectedDay(day)}
                disabled={!day}
                style={[
                  styles.dayCell,
                  !day && { opacity: 0 },
                  isToday && { backgroundColor: "#3B82F6" },
                ]}
              >
                {day && (
                  <>
                    <Text
                      style={[styles.dayText, isToday && { color: "white" }]}
                    >
                      {day}
                    </Text>
                    {hasEvents && (
                      <View style={styles.eventDots}>
                        {events[day].slice(0, 3).map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.dot,
                              isToday && { backgroundColor: "white" },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ---------------- DAY VIEW ----------------
  const dayEvents = events[selectedDay] || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity onPress={() => setSelectedDay(null)}>
          <X size={24} />
        </TouchableOpacity>
      </View>

      <Text style={styles.dayInfo}>
        {new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          selectedDay
        ).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Text>

      {hours.map((hour) => {
        const hourEvents = dayEvents.filter((e) => e.hour === hour);
        return (
          <View key={hour} style={styles.hourRow}>
            <Text style={styles.hourLabel}>{formatHour(hour)}</Text>
            <View style={styles.timeline}>
              {hourEvents.map((event, idx) => (
                <View
                  key={idx}
                  style={[styles.eventBlock, { height: event.duration * 50 }]}
                >
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthName: { fontSize: 18, fontWeight: "600" },
  weekdays: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekdayText: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: 40,
    height: 40,
    margin: 2,
    borderRadius: 6,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: { fontSize: 14 },
  eventDots: { flexDirection: "row", marginTop: 2 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3B82F6",
    marginHorizontal: 1,
  },
  dayInfo: { fontSize: 16, marginBottom: 16, color: "#6B7280" },
  hourRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  hourLabel: { width: 50, fontSize: 12, color: "#6B7280" },
  timeline: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  eventBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#BFDBFE",
    borderLeftWidth: 4,
    borderColor: "#3B82F6",
    borderRadius: 4,
    padding: 4,
  },
  eventTitle: { fontSize: 12, fontWeight: "600" },
  eventTime: { fontSize: 10, color: "#374151" },
});
