import assert from "node:assert/strict";
import test from "node:test";

import { getSetTargetFeedback } from "../src/lib/performanceFeedback.ts";

test("recognizes met, exceeded, and missed strength targets", () => {
  const base = {
    actualDurationSeconds: null,
    actualMetricValue: null,
    performanceType: "reps" as const,
    targetDurationSeconds: null,
    targetMetricValue: null,
    targetReps: 8,
    targetWeight: 100,
  };

  assert.equal(
    getSetTargetFeedback({ ...base, actualReps: 8, actualWeight: 100 })?.status,
    "met",
  );
  assert.equal(
    getSetTargetFeedback({ ...base, actualReps: 9, actualWeight: 100 })?.status,
    "exceeded",
  );
  assert.equal(
    getSetTargetFeedback({ ...base, actualReps: 7, actualWeight: 100 })?.status,
    "missed",
  );
});

test("compares time and metric performances with their targets", () => {
  assert.equal(
    getSetTargetFeedback({
      actualDurationSeconds: 65,
      actualMetricValue: null,
      actualReps: 1,
      actualWeight: 0,
      performanceType: "time",
      targetDurationSeconds: 60,
      targetMetricValue: null,
      targetReps: null,
      targetWeight: null,
    })?.status,
    "exceeded",
  );

  assert.equal(
    getSetTargetFeedback({
      actualDurationSeconds: null,
      actualMetricValue: 500,
      actualReps: 1,
      actualWeight: 0,
      performanceType: "distance",
      targetDurationSeconds: null,
      targetMetricValue: 500,
      targetReps: null,
      targetWeight: null,
    })?.status,
    "met",
  );
});

test("reports met, exceeded, and missed feedback for every non-strength metric", () => {
  for (const actualDurationSeconds of [60, 65, 55]) {
    const expected =
      actualDurationSeconds === 60
        ? "met"
        : actualDurationSeconds > 60
          ? "exceeded"
          : "missed";

    assert.equal(
      getSetTargetFeedback({
        actualDurationSeconds,
        actualMetricValue: null,
        actualReps: 0,
        actualWeight: 0,
        performanceType: "time",
        targetDurationSeconds: 60,
        targetMetricValue: null,
        targetReps: null,
        targetWeight: null,
      })?.status,
      expected,
    );
  }

  for (const performanceType of ["distance", "calories", "rounds"] as const) {
    for (const actualMetricValue of [10, 11, 9]) {
      const expected =
        actualMetricValue === 10
          ? "met"
          : actualMetricValue > 10
            ? "exceeded"
            : "missed";

      assert.equal(
        getSetTargetFeedback({
          actualDurationSeconds: null,
          actualMetricValue,
          actualReps: 0,
          actualWeight: 0,
          performanceType,
          targetDurationSeconds: null,
          targetMetricValue: 10,
          targetReps: null,
          targetWeight: null,
        })?.status,
        expected,
        `${performanceType} should report ${expected}`,
      );
    }
  }
});

test("returns no feedback when the active metric has no target", () => {
  assert.equal(
    getSetTargetFeedback({
      actualDurationSeconds: 60,
      actualMetricValue: null,
      actualReps: 0,
      actualWeight: 0,
      performanceType: "time",
      targetDurationSeconds: null,
      targetMetricValue: null,
      targetReps: null,
      targetWeight: null,
    }),
    null,
  );

  assert.equal(
    getSetTargetFeedback({
      actualDurationSeconds: null,
      actualMetricValue: 10,
      actualReps: 0,
      actualWeight: 0,
      performanceType: "rounds",
      targetDurationSeconds: null,
      targetMetricValue: null,
      targetReps: null,
      targetWeight: null,
    }),
    null,
  );
});
