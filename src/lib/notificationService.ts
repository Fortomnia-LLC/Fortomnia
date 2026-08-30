import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { SupplementProtocol } from "../hooks/useSupplements";
import {
  buildReminderRequests,
  DEFAULT_REMINDER_PREFERENCES,
  type ReminderPreferences,
} from "./reminders";
import {
  buildSupplementNotificationRequests,
  type SupplementNotificationRequest,
} from "./supplementReminders";

const PREFERENCES_KEY = "fortomnia.reminder-preferences.v1";
const IDENTIFIERS_KEY = "fortomnia.reminder-identifiers.v1";
const SUPPLEMENT_PROTOCOLS_KEY = "fortomnia.supplement-reminder-protocols.v1";
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

async function loadStoredSupplementProtocols(): Promise<SupplementProtocol[]> {
  const stored = await AsyncStorage.getItem(SUPPLEMENT_PROTOCOLS_KEY);
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as SupplementProtocol[]) : [];
  } catch {
    return [];
  }
}

function supplementTrigger(
  request: SupplementNotificationRequest,
): Notifications.NotificationTriggerInput {
  const channelId = Platform.OS === "android" ? CHANNEL_ID : undefined;

  if (request.trigger.type === "daily") {
    return {
      channelId,
      hour: request.trigger.hour,
      minute: request.trigger.minute,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    };
  }

  if (request.trigger.type === "weekly") {
    return {
      channelId,
      hour: request.trigger.hour,
      minute: request.trigger.minute,
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: request.trigger.weekday,
    };
  }

  return {
    channelId,
    date: request.trigger.date,
    type: Notifications.SchedulableTriggerInputTypes.DATE,
  };
}

async function replaceScheduledReminders(
  preferences: ReminderPreferences,
  protocols: SupplementProtocol[],
) {
  const protocolRequests = preferences.reminders.supplements.enabled
    ? buildSupplementNotificationRequests(protocols, preferences.quietHours)
    : [];
  const generalRequests = buildReminderRequests(preferences).filter(
    (request) =>
      request.category !== "supplements" || protocolRequests.length === 0,
  );

  await cancelStoredReminders();
  const identifiers: string[] = [];

  try {
    for (const request of generalRequests) {
      identifiers.push(
        await Notifications.scheduleNotificationAsync({
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
        }),
      );
    }

    for (const request of protocolRequests) {
      identifiers.push(
        await Notifications.scheduleNotificationAsync({
          content: {
            body: request.body,
            data: {
              category: "supplements",
              protocolId: request.protocolId,
              slot: request.slot,
            },
            title: request.title,
          },
          trigger: supplementTrigger(request),
        }),
      );
    }
  } catch (error) {
    await Promise.all(
      identifiers.map((identifier) =>
        Notifications.cancelScheduledNotificationAsync(identifier),
      ),
    );
    throw error;
  }

  await AsyncStorage.setItem(IDENTIFIERS_KEY, JSON.stringify(identifiers));
}

export async function saveAndScheduleReminders(
  preferences: ReminderPreferences,
): Promise<NotificationPermissionState> {
  const protocols = await loadStoredSupplementProtocols();
  const hasEnabledReminder = Object.values(preferences.reminders).some(
    (reminder) => reminder.enabled,
  );

  if (!hasEnabledReminder) {
    await cancelStoredReminders();
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return getNotificationPermissionState();
  }

  const granted = await requestNotificationPermission();
  if (!granted) return getNotificationPermissionState();

  await replaceScheduledReminders(preferences, protocols);
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  return "granted";
}

export async function syncSupplementProtocolReminders(
  protocols: SupplementProtocol[],
) {
  await AsyncStorage.setItem(
    SUPPLEMENT_PROTOCOLS_KEY,
    JSON.stringify(protocols),
  );

  if (Platform.OS === "web") return;

  const preferences = await loadReminderPreferences();
  if (!preferences.reminders.supplements.enabled) return;

  const permission = await getNotificationPermissionState();
  if (permission !== "granted") return;

  await replaceScheduledReminders(preferences, protocols);
}
