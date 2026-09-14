import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync("app.json", "utf8");
const config = readFileSync("targets/fortomnia-widgets/expo-target.config.js", "utf8");
const widget = readFileSync("targets/fortomnia-widgets/FortomniaWidgets.swift", "utf8");
const sync = readFileSync("src/components/WidgetSnapshotSync.tsx", "utf8");

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
  assert.match(widget, /\.privacySensitive\(\)/);
  assert.match(widget, /fortomnia:\/\/health-recovery/);
  assert.match(widget, /fortomnia:\/\/workout\//);
});

test("the app publishes only a minimal widget snapshot", () => {
  assert.match(sync, /activeWorkoutName/);
  assert.match(sync, /activeWorkoutSets/);
  assert.match(sync, /healthLastSyncedAt/);
  assert.doesNotMatch(sync, /sleep|heartRate|hrv|weight/i);
});

test("widget changes trigger the signed iOS extensions build", () => {
  const workflow = readFileSync(".github/workflows/eas-ios-watch-build.yml", "utf8");

  assert.match(workflow, /targets\/fortomnia-widgets\/\*\*/);
  assert.match(workflow, /src\/components\/WidgetSnapshotSync\.tsx/);
  assert.match(workflow, /app\.json/);
});
