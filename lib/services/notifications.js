import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const DAILY_CHECKIN_NOTIFICATION_ID = "daily-checkin-8am";

export async function setupNotificationPermissions() {
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === "granted";
}

export async function scheduleDailyCheckInReminder() {
    const granted = await setupNotificationPermissions();
    if (!granted) return false;

    const scheduled =
        await Notifications.getAllScheduledNotificationsAsync();

    const alreadyScheduled = scheduled.some(
        (item) => item.identifier === DAILY_CHECKIN_NOTIFICATION_ID
    );

    if (alreadyScheduled) return true;

    await Notifications.scheduleNotificationAsync({
        identifier: DAILY_CHECKIN_NOTIFICATION_ID,
        content: {
            title: "Daily Check-In Reminder",
            body: "Good morning. Please complete your wellness check-in for today.",
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            //hour: 8,
            //minute: 0,
            hour: new Date().getHours(),
            minute: new Date().getMinutes() + 1,
        },
    });

    return true;
}

export async function cancelDailyCheckInReminder() {
    await Notifications.cancelScheduledNotificationAsync(
        DAILY_CHECKIN_NOTIFICATION_ID
    );
}