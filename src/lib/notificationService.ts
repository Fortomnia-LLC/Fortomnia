import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  buildReminderRequests,
  DEFAULT_REMINDER_PREFERENCES,
  type ReminderPreferences,
} from "./reminders";

const PREFERENCES_KEY = "fortomnia.reminder-preferences.v1";
const IDENTIFIERS_KEY = "fortomnia.reminder-identifiers.v1";
const CHANNEL_ID = "fortomnia-reminders";

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "undetermined"
  | "unavailable";

export function configureNotificationHandler() {
  if (Platform.OS === "web") return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function permissionIsGranted(
  permissions: Notifications.NotificationPermissionsStatus,
): boolean {
  if (permissions.granted) return true;

  const iosStatus = permissions.ios?.status;

  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: "Fortomnia reminders",
  });
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (Platform.OS === "web") return "unavailable";

  await ensureAndroidChannel();
  const permissions = await Notifications.getPermissionsAsync();

  if (permissionIsGranted(permissions)) return "granted";
  return permissions.canAskAgain ? "undetermined" : "denied";
}

async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();

  if (permissionIsGranted(current)) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return permissionIsGranted(requested);
}

async function readIdentifiers(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(IDENTIFIERS_KEY);

  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

async function cancelStoredReminders() {
  const identifiers = await readIdentifiers();

  await Promise.all(
    identifiers.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
  await AsyncStorage.removeItem(IDENTIFIERS_KEY);
}

export async function loadReminderPreferences(): Promise<ReminderPreferences> {
  const stored = await AsyncStorage.getItem(PREFERENCES_KEY);

  if (!stored) return DEFAULT_REMINDER_PREFERENCES;

  try {
    const parsed = JSON.parse(stored) as Partial<ReminderPreferences>;

    return {
      quietHours: {
        ...DEFAULT_REMINDER_PREFERENCES.quietHours,
        ...parsed.quietHours,
      },
      reminders: {
        nutrition: {
          ...DEFAULT_REMINDER_PREFERENCES.reminders.nutrition,
          ...parsed.reminders?.nutrition,
        },
        supplements: {
          ...DEFAULT_REMINDER_PREFERENCES.reminders.supplements,
          ...parsed.reminders?.supplements,
        },
        workout: {
          ...DEFAULT_REMINDER_PREFERENCES.reminders.workout,
          ...parsed.reminders?.workout,
        },
        review: {
          ...DEFAULT_REMINDER_PREFERENCES.reminders.review,
          ...parsed.reminders?.review,
        },
      },
    };
  } catch {
    return DEFAULT_REMINDER_PREFERENCES;
  }
}

export async function saveAndScheduleReminders(
  preferences: ReminderPreferences,
): Promise<NotificationPermissionState> {
  const requests = buildReminderRequests(preferences);

  if (requests.length === 0) {
    await cancelStoredReminders();
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return getNotificationPermissionState();
  }

  const granted = await requestNotificationPermission();

  if (!granted) return getNotificationPermissionState();

  await cancelStoredReminders();
  const identifiers: string[] = [];

  try {
    for (const request of requests) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          body: request.body,
          data: { category: request.category },
          title: request.title,
        },
        trigger: {
          channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
          hour: request.hour,
          minute: request.minute,
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
        },
      });

      identifiers.push(identifier);
    }
  } catch (error) {
    await Promise.all(
      identifiers.map((identifier) =>
        Notifications.cancelScheduledNotificationAsync(identifier),
      ),
    );
    throw error;
  }

  await AsyncStorage.multiSet([
    [PREFERENCES_KEY, JSON.stringify(preferences)],
    [IDENTIFIERS_KEY, JSON.stringify(identifiers)],
  ]);

  return "granted";
}
