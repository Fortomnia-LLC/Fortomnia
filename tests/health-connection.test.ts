import assert from "node:assert/strict";
import test from "node:test";

import { getHealthSyncFreshness, shouldRestoreAppleHealth } from "../src/lib/health/healthConnection.ts";

test("restores Apple Health after the authorization decision was handled", () => {
  assert.equal(shouldRestoreAppleHealth(true, "unnecessary"), true);
});

test("keeps Connect visible when HealthKit still needs to request authorization", () => {
  assert.equal(shouldRestoreAppleHealth(true, "should_request"), false);
});

test("does not restore unavailable or unknown HealthKit states", () => {
  assert.equal(shouldRestoreAppleHealth(false, "unnecessary"), false);
  assert.equal(shouldRestoreAppleHealth(true, "unavailable"), false);
  assert.equal(shouldRestoreAppleHealth(true, "unknown"), false);
});

test("classifies fresh and stale Apple Health syncs", () => {
  const now = new Date("2026-09-01T18:00:00.000Z");

  assert.deepEqual(
    getHealthSyncFreshness("2026-09-01T17:30:00.000Z", now),
    { ageMinutes: 30, status: "fresh" },
  );
  assert.deepEqual(
    getHealthSyncFreshness("2026-09-01T10:00:00.000Z", now),
    { ageMinutes: 480, status: "stale" },
  );
});

test("handles missing, invalid, and future sync timestamps safely", () => {
  const now = new Date("2026-09-01T18:00:00.000Z");

  assert.deepEqual(getHealthSyncFreshness(null, now), {
    ageMinutes: null,
    status: "never_synced",
  });
  assert.deepEqual(getHealthSyncFreshness("not-a-date", now), {
    ageMinutes: null,
    status: "never_synced",
  });
  assert.deepEqual(
    getHealthSyncFreshness("2026-09-01T18:10:00.000Z", now),
    { ageMinutes: -10, status: "clock_skew" },
  );
});
