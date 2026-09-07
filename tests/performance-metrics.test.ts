import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultMetricUnit,
  formatMetricValue,
  getExerciseMetricDefaults,
  usesRepsInReserve,
} from "../src/lib/performanceMetrics.ts";

test("chooses safe default units for new metrics", () => {
  assert.equal(defaultMetricUnit("distance"), "meters");
  assert.equal(defaultMetricUnit("calories"), "calories");
  assert.equal(defaultMetricUnit("rounds"), "rounds");
  assert.equal(defaultMetricUnit("reps"), null);
});

test("formats distance, calorie, and round performance", () => {
  assert.equal(formatMetricValue("distance", 500, "meters"), "500 m");
  assert.equal(formatMetricValue("distance", 3.1, "miles"), "3.1 mi");
  assert.equal(formatMetricValue("calories", 20, "calories"), "20 cal");
  assert.equal(formatMetricValue("rounds", 5, "rounds"), "5 rounds");
});

test("defaults cardio to time while keeping carries distance-based", () => {
  assert.deepEqual(
    getExerciseMetricDefaults({
      equipment: null,
      movement_pattern: "conditioning",
      name: "Outdoor Run",
    }),
    {
      explanation:
        "Cardio defaults to time so every session consistently captures duration and intensity. You can switch to distance, calories, or rounds when that metric better fits the machine.",
      performanceType: "time",
      targetDurationSeconds: 600,
      targetMetricUnit: null,
      targetMetricValue: null,
    },
  );

  assert.equal(
    getExerciseMetricDefaults({
      equipment: "Dumbbells",
      movement_pattern: "carry",
      name: "Farmer Carry",
    }).performanceType,
    "distance",
  );
});

test("defaults cardio machines to time and preserves non-cardio metric defaults", () => {
  assert.equal(
    getExerciseMetricDefaults({
      equipment: "Rower",
      movement_pattern: "conditioning",
      name: "Rowing Machine",
    }).performanceType,
    "time",
  );
  assert.equal(
    getExerciseMetricDefaults({
      equipment: "Bodyweight",
      movement_pattern: "other",
      name: "Plank Hold",
    }).performanceType,
    "time",
  );
  assert.equal(
    getExerciseMetricDefaults({
      equipment: null,
      movement_pattern: "other",
      name: "Bodyweight AMRAP",
    }).performanceType,
    "rounds",
  );
  assert.equal(
    getExerciseMetricDefaults({
      equipment: "Barbell",
      movement_pattern: "squat",
      name: "Back Squat",
    }).performanceType,
    "reps",
  );
});

test("limits RIR to rep-based performance", () => {
  assert.equal(usesRepsInReserve("reps"), true);

  for (const type of ["time", "distance", "calories", "rounds"] as const) {
    assert.equal(usesRepsInReserve(type), false);
  }
});
