import assert from "node:assert/strict";
import test from "node:test";

import { deduplicateHealthSamples, summarizeHealthDay } from "../src/lib/health/healthNormalization.ts";
import type { HealthSample } from "../src/lib/health/healthTypes";

const samples: HealthSample[] = [
  { id: "1", provider: "apple_health", metric: "steps", startAt: "2026-08-29T08:00:00-05:00", value: 1200, unit: "count", externalId: "steps-1" },
  { id: "duplicate", provider: "apple_health", metric: "steps", startAt: "2026-08-29T08:00:00-05:00", value: 1200, unit: "count", externalId: "steps-1" },
  { id: "2", provider: "apple_health", metric: "steps", startAt: "2026-08-29T12:00:00-05:00", value: 800, unit: "count", externalId: "steps-2" },
  { id: "3", provider: "apple_health", metric: "resting_heart_rate", startAt: "2026-08-29T07:00:00-05:00", value: 58, unit: "bpm" },
  { id: "4", provider: "apple_health", metric: "heart_rate_variability", startAt: "2026-08-29T07:05:00-05:00", value: 52, unit: "ms" },
  { id: "5", provider: "apple_health", metric: "sleep", startAt: "2026-08-29T00:00:00-05:00", value: 455, unit: "min" },
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
