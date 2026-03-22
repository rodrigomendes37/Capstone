// @ts-nocheck
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
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

export default function CalendarScreen() {
  const router = useRouter();

  // ALL state hooks first
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [eventScope, setEventScope] = useState("personal");
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newHour, setNewHour] = useState("8");
  const [newDuration, setNewDuration] = useState("1");

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const { role, loadingRole } = useRole();
  const { teamId, loadingTeam } = useTeam();
  const isCoach = role === "coach";

  const eventsByDay = useMemo(() => {
    const map = {};

    for (const event of calendarEvents) {
      const day = new Date(event.event_date + "T00:00:00").getDate();
      if (!map[day]) map[day] = [];
      map[day].push(event);
    }

    return map;
  }, [calendarEvents]);

  async function loadCalendarEvents() {
    setEventsLoading(true);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setCalendarEvents([]);
      setEventsLoading(false);
      return;
    }

    let query = supabase
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: true })
      .order("hour", { ascending: true });

    if (isCoach) {
      // coach sees own personal events + all team events
      query = query.or(
        `created_by.eq.${user.id},and(scope.eq.team,team_id.eq.${teamId})`,
      );
    } else {
      // athlete sees own personal events + all team events
      query = query.or(
        `created_by.eq.${user.id},and(scope.eq.team,team_id.eq.${teamId})`,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.log("Load calendar events error:", error);
      setCalendarEvents([]);
    } else {
      setCalendarEvents(data || []);
    }

    setEventsLoading(false);
  }

  useEffect(() => {
    if (!teamId) return;
    loadCalendarEvents();
  }, [teamId, role]);

  if (loadingRole || loadingTeam) return null;

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  async function addEventToDay(day) {
    const hourNum = Number(newHour);
    const durNum = Number(newDuration);

    if (
      !day ||
      !newTitle.trim() ||
      !newTime.trim() ||
      Number.isNaN(hourNum) ||
      Number.isNaN(durNum)
    ) {
      return;
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return;

    // athletes cannot create team events
    const finalScope = !isCoach ? "personal" : eventScope;

    const eventDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    )
      .toISOString()
      .slice(0, 10);

    const payload = {
      team_id: finalScope === "team" ? teamId : null,
      created_by: user.id,
      scope: finalScope,
      title: newTitle.trim(),
      event_date: eventDate,
      time_label: newTime.trim(),
      hour: hourNum,
      duration: durNum,
    };

    const { error } = await supabase.from("calendar_events").insert(payload);

    if (error) {
      console.log("Add calendar event error:", error);
      return;
    }

    setNewTitle("");
    setNewTime("");
    setNewHour("8");
    setNewDuration("1");

    await loadCalendarEvents();
  }

  async function removeEvent(id) {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Remove calendar event error:", error);
      return;
    }

    await loadCalendarEvents();
  }

  // Calendar calculations
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
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
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  // ---------------- MONTHLY VIEW ----------------
  if (!selectedDay) {
    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
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
            const hasEvents = day && eventsByDay[day];
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
                        {eventsByDay[day].slice(0, 3).map((_, i) => (
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
  const dayEvents = eventsByDay[selectedDay] || [];

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
          selectedDay,
        ).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Text>

      {/* Add event UI */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 12,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ fontWeight: "700", marginBottom: 8 }}>Add Event</Text>

          {isCoach ? (
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setEventScope("personal")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor:
                    eventScope === "personal" ? "#111827" : "transparent",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: eventScope === "personal" ? "white" : "black",
                  }}
                >
                  Personal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setEventScope("team")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor:
                    eventScope === "team" ? "#111827" : "transparent",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: eventScope === "team" ? "white" : "black",
                  }}
                >
                  Team
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ color: "#6B7280", marginBottom: 10 }}>
              You can add personal events only.
            </Text>
          )}

          <TextInput
            placeholder="Title (e.g., Team Lift)"
            value={newTitle}
            onChangeText={setNewTitle}
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 10,
              marginBottom: 10,
            }}
          />

          <TextInput
            placeholder="Time label (e.g., 3:00 PM)"
            value={newTime}
            onChangeText={setNewTime}
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 10,
              marginBottom: 10,
            }}
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              placeholder="Hour (0-23)"
              value={newHour}
              onChangeText={setNewHour}
              keyboardType="numeric"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                padding: 10,
              }}
            />
            <TextInput
              placeholder="Duration (hrs)"
              value={newDuration}
              onChangeText={setNewDuration}
              keyboardType="numeric"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                padding: 10,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={() => addEventToDay(selectedDay)}
            style={{
              backgroundColor: "#22C55E",
              padding: 12,
              borderRadius: 12,
              marginTop: 10,
            }}
          >
            <Text
              style={{ color: "white", fontWeight: "700", textAlign: "center" }}
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>
      

      {hours.map((hour) => {
        const hourEvents = dayEvents.filter((e) => e.hour === hour);

        return (
          <View key={hour} style={styles.hourRow}>
            <Text style={styles.hourLabel}>{formatHour(hour)}</Text>

            <View style={styles.timeline}>
              {hourEvents.map((event) => (
                <View
                  key={event.id}
                  style={[styles.eventBlock, { height: event.duration * 50 }]}
                >
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {event.time_label} • {event.scope}
                  </Text>

                  {(isCoach || event.scope === "personal") && (
                    <TouchableOpacity
                      onPress={() => removeEvent(event.id)}
                      style={{ marginTop: 6 }}
                    >
                      <Text style={{ color: "crimson", fontSize: 11 }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
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
  hourRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  hourLabel: { width: 50, fontSize: 12, color: "#6B7280" },
  timeline: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
    minHeight: 50,
  },
  eventBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#BFDBFE",
    borderLeftWidth: 4,
    borderColor: "#3B82F6",
    borderRadius: 4,
    padding: 6,
  },
  eventTitle: { fontSize: 12, fontWeight: "600" },
  eventTime: { fontSize: 10, color: "#374151" },
});
