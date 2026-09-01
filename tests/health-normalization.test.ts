import assert from "node:assert/strict";
import test from "node:test";

import { deduplicateHealthSamples, summarizeHealthDay } from "../src/lib/health/healthNormalization.ts";
import type { HealthSample } from "../src/lib/health/healthTypes";

function localTimestamp(hour: number, minute = 0) {
  return new Date(2026, 7, 29, hour, minute).toISOString();
}

const samples: HealthSample[] = [
  { id: "1", provider: "apple_health", metric: "steps", startAt: localTimestamp(8), value: 1200, unit: "count", externalId: "steps-1" },
  { id: "duplicate", provider: "apple_health", metric: "steps", startAt: localTimestamp(8), value: 1200, unit: "count", externalId: "steps-1" },
  { id: "2", provider: "apple_health", metric: "steps", startAt: localTimestamp(12), value: 800, unit: "count", externalId: "steps-2" },
  { id: "3", provider: "apple_health", metric: "resting_heart_rate", startAt: localTimestamp(7), value: 58, unit: "bpm" },
  { id: "4", provider: "apple_health", metric: "heart_rate_variability", startAt: localTimestamp(7, 5), value: 52, unit: "ms" },
  { id: "5", provider: "apple_health", metric: "sleep", startAt: localTimestamp(0), value: 455, unit: "min" },
];

test("deduplicates provider samples using external IDs", () => {
  assert.equal(deduplicateHealthSamples(samples).length, 5);
});

test("creates a normalized daily summary", () => {
  assert.deepEqual(
    {
      steps: summarizeHealthDay("2026-08-29", samples).steps,
      restingHeartRateBpm: summarizeHealthDay("2026-08-29", samples).restingHeartRateBpm,
      heartRateVariabilityMs: summarizeHealthDay("2026-08-29", samples).heartRateVariabilityMs,
      sleepMinutes: summarizeHealthDay("2026-08-29", samples).sleepMinutes,
    },
    {
      steps: 2000,
      restingHeartRateBpm: 58,
      heartRateVariabilityMs: 52,
      sleepMinutes: 455,
    },
  );
});

test("assigns overnight sleep to the wake-up date", () => {
  const sleep: HealthSample = {
    id: "overnight",
    provider: "apple_health",
    metric: "sleep",
    startAt: "2026-08-28T23:00:00Z",
    endAt: "2026-08-29T06:30:00Z",
    value: 450,
    unit: "min",
  };

  assert.equal(summarizeHealthDay("2026-08-28", [sleep]).sleepMinutes, null);
  assert.equal(summarizeHealthDay("2026-08-29", [sleep]).sleepMinutes, 450);
});

test("averages multiple HRV readings within a day", () => {
  const readings: HealthSample[] = [
    { id: "hrv-1", provider: "apple_health", metric: "heart_rate_variability", startAt: "2026-08-29T06:00:00Z", value: 40, unit: "ms" },
    { id: "hrv-2", provider: "apple_health", metric: "heart_rate_variability", startAt: "2026-08-29T07:00:00Z", value: 60, unit: "ms" },
  ];

  assert.equal(summarizeHealthDay("2026-08-29", readings).heartRateVariabilityMs, 50);
});

test("groups UTC HealthKit timestamps by the device-local calendar day", () => {
  const lateLocalSample: HealthSample = {
    id: "late-steps",
    provider: "apple_health",
    metric: "steps",
    startAt: localTimestamp(23, 30),
    value: 250,
    unit: "count",
  };

  assert.equal(summarizeHealthDay("2026-08-29", [lateLocalSample]).steps, 250);
});

test("rejects negative and non-finite values from health summaries", () => {
  const invalidSamples: HealthSample[] = [
    { id: "negative-steps", provider: "apple_health", metric: "steps", startAt: localTimestamp(9), value: -500, unit: "count" },
    { id: "nan-steps", provider: "apple_health", metric: "steps", startAt: localTimestamp(10), value: Number.NaN, unit: "count" },
    { id: "infinite-workout", provider: "apple_health", metric: "workout", startAt: localTimestamp(11), value: Number.POSITIVE_INFINITY, unit: "min" },
    { id: "valid-steps", provider: "apple_health", metric: "steps", startAt: localTimestamp(12), value: 750, unit: "count" },
  ];

  const summary = summarizeHealthDay("2026-08-29", invalidSamples);
  assert.equal(summary.steps, 750);
  assert.equal(summary.workoutMinutes, null);
});

test("keeps valid zero values instead of treating them as missing", () => {
  const zeroSample: HealthSample = {
    id: "zero-active-energy",
    provider: "apple_health",
    metric: "active_energy",
    startAt: localTimestamp(8),
    value: 0,
    unit: "kcal",
  };

  assert.equal(
    summarizeHealthDay("2026-08-29", [zeroSample]).activeEnergyKcal,
    0,
  );
});
