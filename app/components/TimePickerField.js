import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

function parseTimeString(value) {
  const base = new Date();
  base.setSeconds(0);
  base.setMilliseconds(0);

  if (!value || !value.includes(":")) {
    base.setHours(8, 0, 0, 0);
    return base;
  }

  const [hours, minutes] = value.split(":").map(Number);
  base.setHours(
    Number.isNaN(hours) ? 8 : hours,
    Number.isNaN(minutes) ? 0 : minutes,
    0,
    0,
  );
  return base;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatLabel(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TimePickerField({ label, value, onChange }) {
  const [show, setShow] = useState(false);

  const pickerDate = useMemo(() => parseTimeString(value), [value]);

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontWeight: "600", marginBottom: 6 }}>{label}</Text>

      <TouchableOpacity
        onPress={() => setShow((prev) => !prev)}
        style={{
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 10,
          padding: 12,
          backgroundColor: "white",
        }}
      >
        <Text>{formatLabel(pickerDate)}</Text>
      </TouchableOpacity>

      {show && (
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            marginTop: 10,
            paddingVertical: 8,
          }}
        >
          <DateTimePicker
            value={pickerDate}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            themeVariant="light"
            textColor="black"
            onChange={(_, selectedDate) => {
              if (!selectedDate) return;
              onChange(formatTime(selectedDate));
              if (Platform.OS !== "ios") setShow(false);
            }}
          />
        </View>
      )}
    </View>
  );
}
