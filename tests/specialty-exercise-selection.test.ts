import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseBestSpecialtyExercise,
  rankSpecialtyExerciseCandidates,
} from "../src/lib/specialtyExerciseSelection.ts";

test("direct event practice wins when its equipment is available", () => {
  const result = chooseBestSpecialtyExercise([
    { exerciseName: "Hercules Hold", specificity: 100, available: true },
    { exerciseName: "Farmer Handle Hold", specificity: 80, available: true },
    { exerciseName: "Heavy Dumbbell Hold", specificity: 50, available: true },
  ]);

  assert.equal(result?.exerciseName, "Hercules Hold");
  assert.match(result?.reason ?? "", /event-specific/);
});

test("coach falls back to the highest-transfer available substitute", () => {
  const result = chooseBestSpecialtyExercise([
    { exerciseName: "Hercules Hold", specificity: 100, available: false },
    { exerciseName: "Farmer Handle Hold", specificity: 80, available: true },
    { exerciseName: "Heavy Dumbbell Hold", specificity: 50, available: true },
  ]);

  assert.equal(result?.exerciseName, "Farmer Handle Hold");
  assert.match(result?.reason ?? "", /Strong transfer/);
});

test("commercial-gym fallback remains usable when specialty implements are unavailable", () => {
  const ranked = rankSpecialtyExerciseCandidates([
    { exerciseName: "Hercules Hold", specificity: 100, available: false },
    { exerciseName: "Farmer Handle Hold", specificity: 80, available: false },
    { exerciseName: "Heavy Dumbbell Hold", specificity: 50, available: true },
  ]);

  assert.deepEqual(ranked.map((item) => item.exerciseName), ["Heavy Dumbbell Hold"]);
  assert.match(ranked[0]?.reason ?? "", /general preparation/);
});

test("unavailable exercises never appear in recommendations", () => {
  const ranked = rankSpecialtyExerciseCandidates([
    { exerciseName: "Conan Carry", specificity: 100, available: false },
    { exerciseName: "Zercher Carry", specificity: 70, available: true },
    { exerciseName: "Front-Loaded Sandbag Carry", specificity: 50, available: false },
  ]);

  assert.deepEqual(ranked.map((item) => item.exerciseName), ["Zercher Carry"]);
});
