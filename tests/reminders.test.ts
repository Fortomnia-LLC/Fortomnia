import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReminderRequests,
  DEFAULT_REMINDER_PREFERENCES,
  disableEveryReminder,
  isTimeInQuietHours,
  parseReminderTime,
  validateReminderPreferences,
} from "../src/lib/reminders.ts";

test("parses valid 24-hour times", () => {
  assert.deepEqual(parseReminderTime("07:05"), { hour: 7, minute: 5 });
  assert.deepEqual(parseReminderTime("23:59"), { hour: 23, minute: 59 });
});

test("rejects invalid reminder times", () => {
  assert.equal(parseReminderTime("7:05"), null);
  assert.equal(parseReminderTime("24:00"), null);
  assert.equal(parseReminderTime("12:60"), null);
});

test("detects overnight quiet hours", () => {
  assert.equal(isTimeInQuietHours("22:00", "21:00", "07:00"), true);
  assert.equal(isTimeInQuietHours("06:59", "21:00", "07:00"), true);
  assert.equal(isTimeInQuietHours("12:00", "21:00", "07:00"), false);
});

test("flags enabled reminders scheduled during quiet hours", () => {
  const preferences = structuredClone(DEFAULT_REMINDER_PREFERENCES);
  preferences.reminders.review.enabled = true;
  preferences.reminders.review.time = "22:00";

  assert.deepEqual(validateReminderPreferences(preferences), [
    "End-of-day review is scheduled during quiet hours.",
  ]);
});

test("builds daily requests only for enabled categories", () => {
  const preferences = structuredClone(DEFAULT_REMINDER_PREFERENCES);
  preferences.reminders.nutrition.enabled = true;
  preferences.reminders.workout.enabled = true;

  assert.deepEqual(
    buildReminderRequests(preferences).map(({ category, hour, minute }) => ({
      category,
      hour,
      minute,
    })),
    [
      { category: "nutrition", hour: 12, minute: 0 },
      { category: "workout", hour: 17, minute: 0 },
    ],
  );
});

test("turn off all preserves configured times", () => {
  const disabled = disableEveryReminder({
    ...structuredClone(DEFAULT_REMINDER_PREFERENCES),
    reminders: {
      ...structuredClone(DEFAULT_REMINDER_PREFERENCES.reminders),
      workout: { enabled: true, time: "18:15" },
    },
  });

  assert.equal(disabled.reminders.workout.enabled, false);
  assert.equal(disabled.reminders.workout.time, "18:15");
});
