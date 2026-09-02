import assert from "node:assert/strict";
import test from "node:test";

import {
  createAppleHealthConnection,
  getHealthSyncFreshness,
  parseAppleHealthConnection,
  shouldRestoreAppleHealth,
} from "../src/lib/health/healthConnection.ts";

test("restores Apple Health after the authorization decision was handled", () => {
  assert.equal(shouldRestoreAppleHealth(true, "unnecessary", true), true);
});

test("keeps Connect visible when HealthKit still needs to request authorization", () => {
  assert.equal(shouldRestoreAppleHealth(true, "should_request", true), false);
});

test("does not restore unavailable, unknown, or explicitly disconnected states", () => {
  assert.equal(shouldRestoreAppleHealth(false, "unnecessary", true), false);
  assert.equal(shouldRestoreAppleHealth(true, "unavailable", true), false);
  assert.equal(shouldRestoreAppleHealth(true, "unknown", true), false);
  assert.equal(shouldRestoreAppleHealth(true, "unnecessary", false), false);
});

test("persists connected state before the first successful sync", () => {
  assert.deepEqual(createAppleHealthConnection(null), {
    connected: true,
    lastSyncedAt: null,
  });
  assert.deepEqual(parseAppleHealthConnection('{"connected":true,"lastSyncedAt":null}'), {
    connected: true,
    lastSyncedAt: null,
  });
});

test("loads legacy connection records and normalizes valid timestamps", () => {
  assert.deepEqual(
    parseAppleHealthConnection('{"connected":true,"lastSyncedAt":"2026-09-01T12:30:00Z"}'),
    { connected: true, lastSyncedAt: "2026-09-01T12:30:00.000Z" },
  );
});

test("rejects malformed connection records and invalid sync timestamps", () => {
  assert.equal(parseAppleHealthConnection("not-json"), null);
  assert.equal(parseAppleHealthConnection('{"connected":false,"lastSyncedAt":null}'), null);
  assert.equal(parseAppleHealthConnection('{"connected":true,"lastSyncedAt":"tomorrow"}'), null);
  assert.throws(() => createAppleHealthConnection("not-a-date"), TypeError);
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
