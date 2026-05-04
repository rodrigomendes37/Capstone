import { useRouter } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import TimePickerField from "../components/TimePickerField";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getStartMinuteOffset(timeLabel = "") {
  const [start] = timeLabel.split(" - ");
  if (!start || !start.includes(":")) return 0;

  const minute = Number(start.split(":")[1] || 0);
  return (minute / 60) * 80;
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarScreen() {
  const router = useRouter();

  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [eventScope, setEventScope] = useState("personal");
  const [newTitle, setNewTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringUntil, setRecurringUntil] = useState("");
  const [recurringDays, setRecurringDays] = useState([]);
  const [recurringStartDate, setRecurringStartDate] = useState("");

  const { role, loadingRole } = useRole();
  const { teamId, loadingTeam } = useTeam();
  const isCoach = role === "coach";

  const eventsByDay = useMemo(() => {
    const map = {};

    for (const event of calendarEvents) {
      const eventDate = new Date(event.event_date + "T00:00:00");

      const sameMonth =
        eventDate.getMonth() === currentMonth.getMonth() &&
        eventDate.getFullYear() === currentMonth.getFullYear();

      if (!sameMonth) continue;

      const day = eventDate.getDate();

      if (!map[day]) map[day] = [];
      map[day].push(event);
    }

    Object.keys(map).forEach((day) => {
      map[day].sort((a, b) => a.hour - b.hour);
    });

    return map;
  }, [calendarEvents, currentMonth]);

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

    // Both athletes and coaches see their own events plus shared team events.
    query = query.or(
      `created_by.eq.${user.id},and(scope.eq.team,team_id.eq.${teamId})`,
    );

    const { data, error } = await query;

    if (error) {
      setCalendarEvents([]);
    } else {
      setCalendarEvents(data || []);
    }

    setEventsLoading(false);
  }

  function resetEventForm() {
    setEditingEvent(null);
    setNewTitle("");
    setStartTime("");
    setEndTime("");
    setEventScope("personal");
    setIsRecurring(false);
    setRecurringStartDate("");
    setRecurringUntil("");
    setRecurringDays([]);
  }

  useEffect(() => {
    if (!teamId) return;
    loadCalendarEvents();
  }, [teamId, role]);

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
            Your account was created successfully, but you have not been assigned to a team yet.
            Please contact your coach or administrator.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  async function addEventToDay(day) {
    if (!day || !newTitle.trim() || !startTime.trim() || !endTime.trim()) {
      Alert.alert(
        "Missing information",
        "Please fill in title, start time, and end time.",
      );
      return;
    }

    const startParts = startTime.split(":");
    const endParts = endTime.split(":");

    const startHour = Number(startParts[0]);
    const startMinute = Number(startParts[1] || 0);
    const endHour = Number(endParts[0]);
    const endMinute = Number(endParts[1] || 0);

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return;
    }

    const startDecimal = startHour + startMinute / 60;
    const endDecimal = endHour + endMinute / 60;
    const duration = endDecimal - startDecimal;

    if (duration <= 0) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return;

    const finalScope = !isCoach ? "personal" : eventScope;

    const eventDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    )
      .toISOString()
      .slice(0, 10);

    // If editing an existing event, update it
    if (editingEvent) {
      const { error } = await supabase
        .from("calendar_events")
        .update({
          scope: finalScope,
          title: newTitle.trim(),
          time_label: `${startTime} - ${endTime}`,
          hour: startHour,
          duration,
        })
        .eq("id", editingEvent.id);

      if (error) {
        Alert.alert("Save failed", "Could not update this event.");
        return;
      }

      resetEventForm();
      setShowAddForm(false);

      await loadCalendarEvents();
      return;
    }

    // One-time event
    if (!isRecurring) {
      const payload = {
        team_id: finalScope === "team" ? teamId : null,
        created_by: user.id,
        scope: finalScope,
        title: newTitle.trim(),
        event_date: eventDate,
        time_label: `${startTime} - ${endTime}`,
        hour: startHour,
        duration,
        recurrence_type: "none",
        recurrence_group_id: null,
        recurrence_until: null,
        recurrence_days: [],
      };

      const { error } = await supabase.from("calendar_events").insert(payload);

      if (error) {
        Alert.alert("Save failed", "Could not save this event.");
        return;
      }
    } else {
      if (!recurringStartDate || !recurringUntil) {
        Alert.alert(
          "Missing dates",
          "Please enter a start date and an end date.",
        );
        return;
      }

      if (recurringDays.length === 0) {
        Alert.alert("Missing weekdays", "Please choose at least one weekday.");
        return;
      }

      const recurrenceGroupId = generateUUID();

      const startDate = new Date(recurringStartDate + "T00:00:00");
      const untilDate = new Date(recurringUntil + "T00:00:00");

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(untilDate.getTime())
      ) {
        Alert.alert(
          "Invalid date",
          "Please enter valid dates in YYYY-MM-DD format.",
        );
        return;
      }

      if (untilDate < startDate) {
        Alert.alert("Invalid range", "End date must be after the start date.");
        return;
      }

      const rows = [];
      const cursor = new Date(startDate);

      while (cursor <= untilDate) {
        const dayCode = cursor.toLocaleDateString("en-US", {
          weekday: "short",
        });

        if (recurringDays.includes(dayCode)) {
          rows.push({
            team_id: finalScope === "team" ? teamId : null,
            created_by: user.id,
            scope: finalScope,
            title: newTitle.trim(),
            event_date: getLocalDateString(cursor),
            time_label: `${startTime} - ${endTime}`,
            hour: startHour,
            duration,
            recurrence_type: "weekly",
            recurrence_group_id: recurrenceGroupId,
            recurrence_until: recurringUntil,
            recurrence_days: recurringDays,
          });
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      if (rows.length === 0) {
        Alert.alert(
          "No events generated",
          "No dates matched the selected weekdays in that range.",
        );
        return;
      }

      const { error } = await supabase.from("calendar_events").insert(rows);

      if (error) {
        Alert.alert("Save failed", "Could not save the recurring events.");
        return;
      }
    }

    resetEventForm();
    setShowAddForm(false);

    await loadCalendarEvents();
  }

  async function removeEvent(event) {
    if (!event) return;

    // Linked workout event: delete workout assignment instead
    if (event.assignment_id && isCoach) {
      const { error } = await supabase
        .from("workout_assignments")
        .delete()
        .eq("id", event.assignment_id);

      if (error) {
        return;
      }

      await loadCalendarEvents();
      return;
    }

    // Recurring series
    if (event.recurrence_group_id) {
      Alert.alert(
        "Remove recurring event",
        "Choose whether to remove only this event or the whole recurring series.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Just this event",
            onPress: async () => {
              const { error } = await supabase
                .from("calendar_events")
                .delete()
                .eq("id", event.id);

              if (error) {
                return;
              }

              await loadCalendarEvents();
            },
          },
          {
            text: "Whole series",
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase
                .from("calendar_events")
                .delete()
                .eq("recurrence_group_id", event.recurrence_group_id);

              if (error) {
                return;
              }

              await loadCalendarEvents();
            },
          },
        ],
      );

      return;
    }

    // Delete only this one event
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", event.id);

    if (error) {
      return;
    }

    await loadCalendarEvents();
  }

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

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const goToPreviousMonth = () => {
    setSelectedDay(null);
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  function toggleRecurringDay(dayName) {
    setRecurringDays((prev) =>
      prev.includes(dayName)
        ? prev.filter((d) => d !== dayName)
        : [...prev, dayName],
    );
  }

  if (!selectedDay) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} />
            </TouchableOpacity>

            <Text style={styles.title}>Calendar</Text>

            <TouchableOpacity
              onPress={() => {
                const nextShow = !showAddForm;

                setEditingEvent(null);
                setShowAddForm(nextShow);

                const today = new Date();
                const defaultDay = selectedDay || today.getDate();
                const defaultMonth = selectedDay
                  ? currentMonth
                  : new Date(today.getFullYear(), today.getMonth(), 1);

                setSelectedDay(defaultDay);
                setCurrentMonth(defaultMonth);

                const startDate = new Date(
                  defaultMonth.getFullYear(),
                  defaultMonth.getMonth(),
                  defaultDay,
                );

                if (nextShow) {
                  resetEventForm();
                  setRecurringStartDate(getLocalDateString(startDate));
                }
              }}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>
                {showAddForm ? "Close" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPreviousMonth}>
              <ChevronLeft size={24} />
            </TouchableOpacity>
            <Text style={styles.monthName}>{monthName}</Text>
            <TouchableOpacity onPress={goToNextMonth}>
              <ChevronRight size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdays}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const hasEvents = day && eventsByDay[day];
              const now = new Date();
              const isToday =
                day === now.getDate() &&
                currentMonth.getMonth() === now.getMonth() &&
                currentMonth.getFullYear() === now.getFullYear();

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
      </SafeAreaView>
    );
  }

  const dayEvents = eventsByDay[selectedDay] || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                const nextShow = !showAddForm;

                setEditingEvent(null);
                setShowAddForm(nextShow);

                const startDate = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  selectedDay,
                );

                if (nextShow) {
                  resetEventForm();
                  setRecurringStartDate(getLocalDateString(startDate));
                }
              }}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>
                {showAddForm ? "Close" : "Add"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedDay(null)}>
              <X size={24} />
            </TouchableOpacity>
          </View>
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

        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>
              Add Event
            </Text>

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
              placeholderTextColor="#6B7280"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
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

            {!editingEvent?.assignment_id && (
              <>
                <TouchableOpacity
                  onPress={() => setIsRecurring((prev) => !prev)}
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ textAlign: "center", fontWeight: "600" }}>
                    {isRecurring
                      ? "Recurring Event: ON"
                      : "Recurring Event: OFF"}
                  </Text>
                </TouchableOpacity>

                {isRecurring && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontWeight: "600", marginBottom: 8 }}>
                      Repeat on:
                    </Text>

                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day) => (
                          <TouchableOpacity
                            key={day}
                            onPress={() => toggleRecurringDay(day)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              backgroundColor: recurringDays.includes(day)
                                ? "#111827"
                                : "transparent",
                            }}
                          >
                            <Text
                              style={{
                                color: recurringDays.includes(day)
                                  ? "white"
                                  : "black",
                              }}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </View>

                    <TextInput
                      placeholder="Start date (YYYY-MM-DD)"
                      placeholderTextColor="#6B7280"
                      value={recurringStartDate}
                      onChangeText={setRecurringStartDate}
                      style={[styles.input, { marginTop: 12 }]}
                    />

                    <TextInput
                      placeholder="Repeat until (YYYY-MM-DD)"
                      placeholderTextColor="#6B7280"
                      value={recurringUntil}
                      onChangeText={setRecurringUntil}
                      style={[styles.input, { marginTop: 12 }]}
                    />
                  </View>
                )}

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
                    style={{
                      color: "white",
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    {editingEvent ? "Save Changes" : "Add"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {hours.map((hour) => {
          const hourEvents = dayEvents.filter((e) => e.hour === hour);

          return (
            <View key={hour} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{formatHour(hour)}</Text>

              <View style={styles.timeline}>
                {hourEvents.map((event) => (
                  <View
                    key={event.id}
                    style={[
                      styles.eventBlock,
                      {
                        top: getStartMinuteOffset(event.time_label),
                        height: Math.max(event.duration * 80, 64),
                      },
                    ]}
                  >
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>
                      {event.time_label} • {event.scope}
                    </Text>

                    <View
                      style={{ flexDirection: "row", gap: 12, marginTop: 6 }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setEditingEvent(event);
                          setNewTitle(event.title || "");
                          const [start = "", end = ""] = (
                            event.time_label || ""
                          ).split(" - ");
                          setStartTime(start);
                          setEndTime(end);
                          setEventScope(event.scope || "personal");
                          setShowAddForm(true);
                          setIsRecurring(event.recurrence_type === "weekly");
                          setRecurringUntil(event.recurrence_until || "");
                          setRecurringDays(event.recurrence_days || []);
                          setRecurringStartDate(event.event_date || "");
                        }}
                      >
                        <Text style={{ color: "#2563EB", fontSize: 11 }}>
                          Edit
                        </Text>
                      </TouchableOpacity>

                      {(isCoach || event.scope === "personal") && (
                        <TouchableOpacity onPress={() => removeEvent(event)}>
                          <Text style={{ color: "crimson", fontSize: 11 }}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    minHeight: 56,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: { fontSize: 24, fontWeight: "bold" },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  monthName: { fontSize: 18, fontWeight: "600" },
  weekdays: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  weekdayText: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
  },
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
  dayInfo: {
    fontSize: 16,
    marginBottom: 16,
    color: "#6B7280",
    paddingHorizontal: 16,
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    minHeight: 80,
    paddingHorizontal: 16,
  },
  hourLabel: {
    width: 56,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    paddingRight: 8,
    paddingTop: 2,
  },
  timeline: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
    minHeight: 80,
    marginLeft: 4,
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
    minHeight: 70,
    overflow: "hidden",
    zIndex: 2,
  },
  eventTitle: { fontSize: 12, fontWeight: "600" },
  eventTime: { fontSize: 10, color: "#374151" },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#22C55E",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
