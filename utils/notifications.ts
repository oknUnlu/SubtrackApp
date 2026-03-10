import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getSubscriptions, getSetting } from "../database/db";

/**
 * Flag that tracks whether expo-notifications is available in this runtime.
 * Expo Go removed push notification support in SDK 53+, so we gracefully
 * skip all notification calls when running inside Expo Go.
 */
let notificationsAvailable = true;

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  notificationsAvailable = false;
  console.warn("expo-notifications is not available in this environment (Expo Go?).");
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!notificationsAvailable) return false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    notificationsAvailable = false;
    return false;
  }
}

export async function scheduleSubscriptionReminder(
  subscriptionId: string,
  title: string,
  amount: number,
  nextDate: string,
  daysBefore: number = 1,
  currencySymbol: string = "₺"
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Cancel existing notification for this subscription
    await cancelSubscriptionReminder(subscriptionId);

    const reminderDate = new Date(nextDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM

    // Don't schedule if the reminder date is in the past
    if (reminderDate.getTime() <= Date.now()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${title} Renewal`,
        body: `${title} (${currencySymbol}${amount.toFixed(2)}) renews soon.`,
        data: { subscriptionId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
      identifier: `sub_${subscriptionId}`,
    });

    return id;
  } catch {
    notificationsAvailable = false;
    return null;
  }
}

export async function cancelSubscriptionReminder(subscriptionId: string): Promise<void> {
  if (!notificationsAvailable) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(`sub_${subscriptionId}`);
  } catch {
    // Notification may not exist or notifications not available
  }
}

export async function rescheduleAllReminders(): Promise<void> {
  if (Platform.OS === "web" || !notificationsAvailable) return;

  try {
    const subs = await getSubscriptions();
    const daysSetting = await getSetting("reminderDaysBefore");
    const daysBefore = daysSetting ? parseInt(daysSetting, 10) : 1;
    const currSetting = await getSetting("currency");
    const symbol = currSetting === "USD" ? "$" : currSetting === "EUR" ? "€" : "₺";

    for (const sub of subs) {
      if (sub.nextDate) {
        await scheduleSubscriptionReminder(sub.id, sub.title, sub.amount, sub.nextDate, daysBefore, symbol);
      }
    }
  } catch {
    // Notifications not available in this environment
  }
}
