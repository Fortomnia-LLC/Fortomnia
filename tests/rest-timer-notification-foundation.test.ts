import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync("app.json", "utf8");
const layout = readFileSync("app/_layout.tsx", "utf8");
const notifications = readFileSync("src/lib/notificationService.ts", "utf8");
const responses = readFileSync(
  "src/components/notification-response-handler.tsx",
  "utf8",
);
const workout = readFileSync("src/screens/WorkoutDetailScreen.tsx", "utf8");
const watchStore = readFileSync(
  "targets/fortomnia-watch/WatchWorkoutStore.swift",
  "utf8",
);

test("rest timers use local system notifications outside the foreground", () => {
  assert.match(app, /expo-notifications/);
  assert.match(notifications, /scheduleRestTimerNotification/);
  assert.match(notifications, /SchedulableTriggerInputTypes\.DATE/);
  assert.match(notifications, /sound: "default"/);
  assert.match(notifications, /fortomnia:\/\/workout\//);
  assert.match(workout, /scheduleRestTimerNotification\(restEndsAt, workoutId\)/);
  assert.match(workout, /cancelRestTimerNotification/);
});

test("the Watch schedules its own rest completion alert", () => {
  assert.match(watchStore, /UNUserNotificationCenter/);
  assert.match(watchStore, /requestAuthorization/);
  assert.match(watchStore, /UNTimeIntervalNotificationTrigger/);
  assert.match(watchStore, /content\.sound = \.default/);
  assert.match(workout, /restEndsAt/);
});

test("notification taps return to the active workout", () => {
  assert.match(layout, /NotificationResponseHandler/);
  assert.match(responses, /addNotificationResponseReceivedListener/);
  assert.match(responses, /getLastNotificationResponseAsync/);
  assert.match(responses, /value\.startsWith\("fortomnia:\/\/"\)/);
  assert.match(responses, /Linking\.openURL/);
});
