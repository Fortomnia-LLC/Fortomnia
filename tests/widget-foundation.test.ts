import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync("app.json", "utf8");
const config = readFileSync("targets/fortomnia-widgets/expo-target.config.js", "utf8");
const widget = readFileSync("targets/fortomnia-widgets/FortomniaWidgets.swift", "utf8");
const sync = readFileSync("src/components/WidgetSnapshotSync.tsx", "utf8");
const repository = readFileSync("src/repositories/widget-snapshot-repository.ts", "utf8");
const liveActivityModule = readFileSync(
  "modules/fortomnia-live-activity/ios/FortomniaLiveActivityModule.swift",
  "utf8",
);
const liveActivityHook = readFileSync("src/hooks/use-workout-live-activity.ts", "utf8");

test("app and widget share one narrowly scoped App Group", () => {
  const group = "group.com.grc0830source.fortomnia.widgets";
  assert.match(app, new RegExp(group.replaceAll(".", "\\.")));
  assert.match(config, /com\.apple\.security\.application-groups/);
  assert.match(sync, new RegExp(group.replaceAll(".", "\\.")));
  assert.match(widget, new RegExp(group.replaceAll(".", "\\.")));
});

test("Apple extensions inherit the next App Store build number", () => {
  const expoConfig = JSON.parse(app).expo;

  assert.equal(expoConfig.ios.buildNumber, "27");
});

test("widget supports Home and Lock Screen families with privacy-safe links", () => {
  assert.match(widget, /\.systemSmall/);
  assert.match(widget, /\.systemMedium/);
  assert.match(widget, /\.accessoryRectangular/);
  assert.match(widget, /\.accessoryCircular/);
  assert.match(widget, /\.privacySensitive\(\)/);
  assert.match(widget, /fortomnia:\/\/health-recovery/);
  assert.match(widget, /fortomnia:\/\/workout\//);
});

test("the app publishes only a minimal widget snapshot", () => {
  assert.match(sync, /activeWorkoutName/);
  assert.match(sync, /activeWorkoutSets/);
  assert.match(sync, /activeWorkoutPlannedSets/);
  assert.match(sync, /healthLastSyncedAt/);
  assert.match(sync, /nextWorkoutName/);
  assert.match(sync, /nextWorkoutExerciseCount/);
  assert.match(sync, /nextWorkoutLocationName/);
  assert.match(sync, /recoveryBand/);
  assert.match(sync, /recoveryLabel/);
  assert.match(sync, /recoveryScore/);
  assert.doesNotMatch(sync, /sleep|heartRate|hrv|weight/i);
});

test("next-workout widget data uses the existing templates and active location", () => {
  assert.match(repository, /from\("workout_templates"\)/);
  assert.match(repository, /order\("updated_at", \{ ascending: false \}\)/);
  assert.match(repository, /from\("workout_template_exercises"\)/);
  assert.match(repository, /from\("training_locations"\)/);
  assert.match(repository, /eq\("is_active", true\)/);
  assert.match(widget, /fortomnia:\/\/template\//);
  assert.match(widget, /Workout ready/);
});

test("recovery widget reuses readiness while publishing no raw inputs", () => {
  assert.match(repository, /from\("daily_recovery_checkins"\)/);
  assert.match(repository, /calculateReadiness/);
  assert.match(widget, /FortomniaRecoveryWidget/);
  assert.match(widget, /fortomnia:\/\/recovery/);
  assert.match(widget, /fortomnia:\/\/recovery-check-in/);
  assert.match(widget, /\.privacySensitive\(\)/);
  assert.doesNotMatch(sync, /sleepDuration|sleepQuality|energyLevel|muscleSoreness|stressLevel|mood/);
});

test("widget changes trigger the signed iOS extensions build", () => {
  const workflow = readFileSync(".github/workflows/eas-ios-watch-build.yml", "utf8");

  assert.match(workflow, /targets\/fortomnia-widgets\/\*\*/);
  assert.match(workflow, /src\/components\/WidgetSnapshotSync\.tsx/);
  assert.match(workflow, /app\.json/);
});

test("active workouts drive one native Live Activity", () => {
  assert.match(app, /NSSupportsLiveActivities/);
  assert.match(widget, /ActivityConfiguration\(for: FortomniaWorkoutAttributes\.self\)/);
  assert.match(widget, /FortomniaWorkoutLiveActivity\(\)/);
  assert.match(liveActivityModule, /Activity<FortomniaWorkoutAttributes>\.activities/);
  assert.match(liveActivityModule, /Activity\.request/);
  assert.match(liveActivityModule, /activity\.update/);
  assert.match(liveActivityModule, /activity\.end/);
  assert.match(liveActivityHook, /getNextWorkoutSet/);
  assert.match(liveActivityHook, /restEndsAt/);
});

test("Live Activity changes trigger the signed extensions build", () => {
  const workflow = readFileSync(".github/workflows/eas-ios-watch-build.yml", "utf8");

  assert.match(workflow, /modules\/fortomnia-live-activity\/\*\*/);
  assert.match(workflow, /src\/hooks\/use-workout-live-activity\.ts/);
});
