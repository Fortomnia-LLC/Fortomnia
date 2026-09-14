import assert from "node:assert/strict";
import test from "node:test";

import {
  applyHealthConnectAggregates,
  getLocalHealthDayRange,
} from "../src/lib/health/healthConnectAggregation.ts";

test("Health Connect aggregates replace overlapping raw activity and sleep totals", () => {
  const result = applyHealthConnectAggregates(
    [{
      date: "2026-09-14",
      steps: 18_000,
      activeEnergyKcal: 1_200,
      sleepMinutes: 900,
      workoutMinutes: 120,
      restingHeartRateBpm: 58,
      heartRateVariabilityMs: 52,
    }],
    [{
      date: "2026-09-14",
      steps: 9_200,
      activeEnergyKcal: 640,
      sleepMinutes: 450,
      workoutMinutes: 60,
    }],
  );

  assert.deepEqual(result, [{
    date: "2026-09-14",
    steps: 9_200,
    activeEnergyKcal: 640,
    sleepMinutes: 450,
    workoutMinutes: 60,
    restingHeartRateBpm: 58,
    heartRateVariabilityMs: 52,
  }]);
});

test("missing aggregate values clear raw cumulative totals without hiding point metrics", () => {
  const result = applyHealthConnectAggregates(
    [{ date: "2026-09-14", steps: 100, restingHeartRateBpm: 60 }],
    [{ date: "2026-09-14" }],
  );

  assert.deepEqual(result, [{
    date: "2026-09-14",
    steps: null,
    activeEnergyKcal: null,
    sleepMinutes: null,
    workoutMinutes: null,
    restingHeartRateBpm: 60,
  }]);
});

test("creates consecutive local-day ranges for Health Connect aggregation", () => {
  const range = getLocalHealthDayRange("2026-09-14");
  assert.ok(Date.parse(range.endAt) > Date.parse(range.startAt));
  assert.equal(
    Date.parse(range.endAt) - Date.parse(range.startAt),
    24 * 60 * 60 * 1000,
  );
});
