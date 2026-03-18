import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { getSubscriptions, getSetting } from "../database/db";

/**
 * expo-notifications is completely unavailable in Expo Go since SDK 53.
 * We detect Expo Go via Constants.executionEnvironment and skip loading
 * the module entirely to avoid the console error / red screen.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import("expo-notifications") | null = null;

if (!isExpoGo && Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require("expo-notifications");
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    Notifications = null;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    Notifications = null;
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
  if (!Notifications) return null;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    await cancelSubscriptionReminder(subscriptionId);

    const reminderDate = new Date(nextDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);
    reminderDate.setHours(9, 0, 0, 0);

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
    Notifications = null;
    return null;
  }
}

export async function cancelSubscriptionReminder(subscriptionId: string): Promise<void> {
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(`sub_${subscriptionId}`);
  } catch {
    // Notification may not exist
  }
}

export async function rescheduleAllReminders(): Promise<void> {
  if (!Notifications) return;

  try {
    const subs = await getSubscriptions();
    const daysSetting = await getSetting("reminderDaysBefore");
    const daysBefore = daysSetting ? parseInt(daysSetting, 10) : 1;
    const currSetting = await getSetting("currency");
    const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", TRY: "₺", BRL: "R$", INR: "₹", IDR: "Rp", JPY: "¥", KRW: "₩" };
    const symbol = currencySymbols[currSetting ?? "TRY"] ?? "₺";

    for (const sub of subs) {
      if (sub.nextDate) {
        await scheduleSubscriptionReminder(sub.id, sub.title, sub.amount, sub.nextDate, daysBefore, symbol);
      }
    }
  } catch {
    // Notifications not available
  }
}
