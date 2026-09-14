import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const manifest = readFileSync(
  resolve(repositoryRoot, "modules/fortomnia-health/android/src/main/AndroidManifest.xml"),
  "utf8",
);

const rationaleActivity = readFileSync(
  resolve(
    repositoryRoot,
    "modules/fortomnia-health/android/src/main/java/expo/modules/fortomniahealth/HealthPermissionsRationaleActivity.kt",
  ),
  "utf8",
);

test("routes Health Connect privacy actions on pre-Android 14 and Android 14+", () => {
  assert.match(manifest, /androidx\.health\.ACTION_SHOW_PERMISSIONS_RATIONALE/);
  assert.match(manifest, /android\.intent\.action\.VIEW_PERMISSION_USAGE/);
  assert.match(manifest, /android\.permission\.START_VIEW_PERMISSION_USAGE/);
  assert.match(manifest, /android\.intent\.category\.HEALTH_PERMISSIONS/);
  assert.match(
    manifest,
    /android:targetActivity="expo\.modules\.fortomniahealth\.HealthPermissionsRationaleActivity"/,
  );
});

test("opens the public Fortomnia health-data privacy rationale", () => {
  assert.match(
    rationaleActivity,
    /https:\/\/fortomnia\.com\/privacy#health-data/,
  );
  assert.match(rationaleActivity, /Intent\.ACTION_VIEW/);
  assert.match(rationaleActivity, /finish\(\)/);
});
