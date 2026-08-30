import assert from "node:assert/strict";
import test from "node:test";

import {
  assessRecoveryBaseline,
  RECOVERY_BASELINE_WINDOW_DAYS,
} from "../src/lib/health/recoveryBaseline.ts";
import type { DailyHealthSummary } from "../src/lib/health/healthTypes.ts";

function history(days: number, overrides: Partial<DailyHealthSummary> = {}) {
  return Array.from({ length: days }, (_, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    sleepMinutes: 480,
    restingHeartRateBpm: 60,
    heartRateVariabilityMs: 50,
    ...overrides,
  }));
}

test("requires at least seven observations before judging recovery", () => {
  const result = assessRecoveryBaseline({ date: "2026-08-29", sleepMinutes: 360, restingHeartRateBpm: 70, heartRateVariabilityMs: 35 }, history(6));
  assert.equal(result.band, "building_baseline");
  assert.ok(result.comparisons.every((comparison) => comparison.status === "insufficient_data"));
});

test("healthy signals near baseline support the planned session", () => {
  const result = assessRecoveryBaseline({ date: "2026-08-29", sleepMinutes: 490, restingHeartRateBpm: 59, heartRateVariabilityMs: 53 }, history(14));
  assert.equal(result.band, "ready");
  assert.equal(result.baselineDays, 14);
  assert.ok(result.comparisons.every((comparison) => comparison.status === "within_range"));
});

test("one concerning signal recommends adjusting rather than full recovery", () => {
  const result = assessRecoveryBaseline({ date: "2026-08-29", sleepMinutes: 360, restingHeartRateBpm: 60, heartRateVariabilityMs: 50 }, history(14));
  assert.equal(result.band, "adjust");
  assert.equal(result.comparisons[0].status, "concern");
});

test("multiple strained signals produce recovery guidance", () => {
  const result = assessRecoveryBaseline({ date: "2026-08-29", sleepMinutes: 370, restingHeartRateBpm: 67, heartRateVariabilityMs: 38 }, history(21));
  assert.equal(result.band, "recover");
  assert.equal(result.comparisons[0].status, "concern");
  assert.equal(result.comparisons[1].status, "concern");
  assert.equal(result.comparisons[2].status, "concern");
  assert.match(result.explanation, /baseline/);
});

test("uses only the most recent 28 historical days", () => {
  const result = assessRecoveryBaseline({ date: "2026-09-30", sleepMinutes: 480, restingHeartRateBpm: 60, heartRateVariabilityMs: 50 }, history(35));
  assert.equal(result.baselineDays, RECOVERY_BASELINE_WINDOW_DAYS);
  assert.equal(RECOVERY_BASELINE_WINDOW_DAYS, 28);
});

test("can assess with two complete signals when a third is unavailable", () => {
  const result = assessRecoveryBaseline({ date: "2026-08-29", sleepMinutes: 430, restingHeartRateBpm: 60, heartRateVariabilityMs: null }, history(10, { heartRateVariabilityMs: null }));
  assert.notEqual(result.band, "building_baseline");
  assert.equal(result.comparisons[2].status, "insufficient_data");
});

test("ignores future and same-day entries when constructing the personal baseline", () => {
  const result = assessRecoveryBaseline(
    { date: "2026-08-20", sleepMinutes: 480, restingHeartRateBpm: 60, heartRateVariabilityMs: 50 },
    [
      ...history(14),
      { date: "2026-08-20", sleepMinutes: 100, restingHeartRateBpm: 100, heartRateVariabilityMs: 10 },
      { date: "2026-08-21", sleepMinutes: 100, restingHeartRateBpm: 100, heartRateVariabilityMs: 10 },
    ],
  );
  assert.equal(result.band, "ready");
  assert.equal(result.baselineDays, 14);
});
