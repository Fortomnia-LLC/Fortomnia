import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getNotificationPermissionState,
  loadReminderPreferences,
  saveAndScheduleReminders,
  type NotificationPermissionState,
} from "../lib/notificationService";
import {
  DEFAULT_REMINDER_PREFERENCES,
  disableEveryReminder,
  REMINDER_CATEGORIES,
  REMINDER_LABELS,
  validateReminderPreferences,
  type ReminderCategory,
  type ReminderPreferences,
} from "../lib/reminders";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<ReminderPreferences>(
    DEFAULT_REMINDER_PREFERENCES,
  );
  const [permission, setPermission] =
    useState<NotificationPermissionState>("undetermined");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      loadReminderPreferences(),
      getNotificationPermissionState(),
    ])
      .then(([loadedPreferences, loadedPermission]) => {
        if (!active) return;
        setPreferences(loadedPreferences);
        setPermission(loadedPermission);
      })
      .catch((error) => {
        if (!active) return;
        setMessage(
          error instanceof Error
            ? error.message
            : "Reminder settings could not load.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updateReminder(
    category: ReminderCategory,
    changes: Partial<ReminderPreferences["reminders"][ReminderCategory]>,
  ) {
    setPreferences((current) => ({
      ...current,
      reminders: {
        ...current.reminders,
        [category]: {
          ...current.reminders[category],
          ...changes,
        },
      },
    }));
    setMessage(null);
  }

  async function save(preferencesToSave: ReminderPreferences) {
    const errors = validateReminderPreferences(preferencesToSave);

    if (errors.length > 0) {
      setMessage(errors[0]);
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const nextPermission =
        await saveAndScheduleReminders(preferencesToSave);
      setPermission(nextPermission);
      setPreferences(preferencesToSave);

      if (
        nextPermission !== "granted" &&
        REMINDER_CATEGORIES.some(
          (category) => preferencesToSave.reminders[category].enabled,
        )
      ) {
        setMessage(
          "Notifications are off. Enable them in your device settings to use reminders.",
        );
      } else {
        setMessage(
          REMINDER_CATEGORIES.some(
            (category) => preferencesToSave.reminders[category].enabled,
          )
            ? "Reminders saved."
            : "All reminders are off.",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Reminders could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color="#2563EB" size="large" />
      </SafeAreaView>
    );
  }

  const permissionLabel =
    permission === "granted"
      ? "Allowed"
      : permission === "denied"
        ? "Blocked in device settings"
        : permission === "unavailable"
          ? "Unavailable on web"
          : "Asked only when you enable a reminder";

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityLabel="Back to profile"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Profile</Text>
          </Pressable>

          <Text style={styles.eyebrow}>REMINDERS</Text>
          <Text style={styles.title}>Stay consistent</Text>
          <Text style={styles.subtitle}>
            Choose only the reminders that help. Times follow your device's
            current time zone.
          </Text>

          <View style={styles.permissionCard}>
            <Text style={styles.permissionLabel}>NOTIFICATION PERMISSION</Text>
            <Text style={styles.permissionValue}>{permissionLabel}</Text>
            {permission === "denied" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openSettings()}
                style={styles.settingsButton}
              >
                <Text style={styles.settingsButtonText}>
                  Open device settings
                </Text>
              </Pressable>
            ) : null}
          </View>

          {REMINDER_CATEGORIES.map((category) => {
            const reminder = preferences.reminders[category];

            return (
              <View key={category} style={styles.reminderCard}>
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderText}>
                    <Text style={styles.reminderTitle}>
                      {REMINDER_LABELS[category]}
                    </Text>
                    <Text style={styles.reminderDescription}>
                      One reminder each enabled day
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`${REMINDER_LABELS[category]} reminder`}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: reminder.enabled }}
                    onPress={() =>
                      updateReminder(category, {
                        enabled: !reminder.enabled,
                      })
                    }
                    style={[
                      styles.toggle,
                      reminder.enabled && styles.toggleEnabled,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        reminder.enabled && styles.toggleThumbEnabled,
                      ]}
                    />
                  </Pressable>
                </View>

                <Text style={styles.timeLabel}>Daily time (24-hour)</Text>
                <TextInput
                  accessibilityLabel={`${REMINDER_LABELS[category]} time`}
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onChangeText={(time) => updateReminder(category, { time })}
                  placeholder="HH:MM"
                  placeholderTextColor="#727885"
                  style={styles.timeInput}
                  value={reminder.time}
                />
              </View>
            );
          })}

          <View style={styles.quietCard}>
            <Text style={styles.sectionTitle}>Quiet hours</Text>
            <Text style={styles.sectionDescription}>
              Enabled reminders cannot be scheduled inside this period.
            </Text>
            <View style={styles.quietRow}>
              <View style={styles.quietField}>
                <Text style={styles.timeLabel}>Start</Text>
                <TextInput
                  accessibilityLabel="Quiet hours start"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onChangeText={(start) =>
                    setPreferences((current) => ({
                      ...current,
                      quietHours: { ...current.quietHours, start },
                    }))
                  }
                  style={styles.timeInput}
                  value={preferences.quietHours.start}
                />
              </View>
              <View style={styles.quietField}>
                <Text style={styles.timeLabel}>End</Text>
                <TextInput
                  accessibilityLabel="Quiet hours end"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onChangeText={(end) =>
                    setPreferences((current) => ({
                      ...current,
                      quietHours: { ...current.quietHours, end },
                    }))
                  }
                  style={styles.timeInput}
                  value={preferences.quietHours.end}
                />
              </View>
            </View>
          </View>

          {message ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={styles.message}
            >
              {message}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel="Save reminder settings"
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving, disabled: isSaving }}
            disabled={isSaving}
            onPress={() => save(preferences)}
            style={[styles.saveButton, isSaving && styles.disabled]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Save reminders</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityLabel="Turn off all reminders"
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving }}
            disabled={isSaving}
            onPress={() => save(disableEveryReminder(preferences))}
            style={[styles.offButton, isSaving && styles.disabled]}
          >
            <Text style={styles.offText}>Turn off all reminders</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    flex: 1,
    justifyContent: "center",
  },
  screen: { backgroundColor: "#0B0B0B", flex: 1 },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  backButton: { alignSelf: "flex-start", marginBottom: 24, paddingVertical: 8 },
  backText: { color: "#60A5FA", fontSize: 16, fontWeight: "700" },
  eyebrow: {
    color: "#60A5FA",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.5,
  },
  title: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", marginTop: 8 },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 24,
    marginTop: 8,
  },
  permissionCard: {
    backgroundColor: "#101827",
    borderColor: "#1D4ED8",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  permissionLabel: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  permissionValue: { color: "#E5E7EB", fontSize: 14, marginTop: 7 },
  settingsButton: { alignSelf: "flex-start", marginTop: 12, paddingVertical: 6 },
  settingsButtonText: { color: "#60A5FA", fontWeight: "800" },
  reminderCard: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  reminderHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reminderText: { flex: 1, paddingRight: 16 },
  reminderTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  reminderDescription: { color: "#9CA3AF", fontSize: 13, marginTop: 4 },
  toggle: {
    backgroundColor: "#3F3F46",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 54,
  },
  toggleEnabled: { backgroundColor: "#2563EB" },
  toggleThumb: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    height: 26,
    width: 26,
  },
  toggleThumbEnabled: { alignSelf: "flex-end" },
  timeLabel: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 16,
  },
  timeInput: {
    backgroundColor: "#0F0F0F",
    borderColor: "#3F3F46",
    borderRadius: 10,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quietCard: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    padding: 16,
  },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  sectionDescription: { color: "#9CA3AF", fontSize: 13, marginTop: 5 },
  quietRow: { flexDirection: "row", gap: 12 },
  quietField: { flex: 1 },
  message: { color: "#D1D5DB", fontSize: 14, marginTop: 18 },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    marginTop: 22,
    minHeight: 52,
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  offButton: {
    alignItems: "center",
    borderColor: "#52525B",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 14,
  },
  offText: { color: "#D1D5DB", fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
