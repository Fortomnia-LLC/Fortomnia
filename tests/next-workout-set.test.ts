import assert from "node:assert/strict";
import test from "node:test";

import type {
  LoggedSet,
  PlannedExercise,
} from "../src/hooks/useWorkoutSession.ts";
import { getNextWorkoutSet } from "../src/lib/workoutSets.ts";

function planned(
  id: string,
  name: string,
  position: number,
  targetSets = 3,
): PlannedExercise {
  return {
    exercise_id: id,
    exercise_name: name,
    id: `plan-${id}`,
    position,
    rep_max: 12,
    rep_min: 8,
    target_rir: 2,
    target_sets: targetSets,
  };
}

function logged(
  id: string,
  exerciseId: string,
  setNumber: number,
  weight = 100,
): LoggedSet {
  return {
    exercise_id: exerciseId,
    exercise_name: exerciseId,
    id,
    reps: 9,
    reps_in_reserve: 2,
    set_number: setNumber,
    set_type: "working",
    weight,
    weight_unit: "lb",
  };
}

test("selects the first unfinished exercise in plan order", () => {
  const result = getNextWorkoutSet(
    [
      logged("bench-1", "bench", 1),
      logged("row-1", "row", 1),
      logged("bench-2", "bench", 2),
    ],
    [planned("row", "Row", 2), planned("bench", "Bench", 1)],
  );

  assert.ok(result);
  assert.equal(result.exercise.exercise_id, "bench");
  assert.equal(result.setNumber, 3);
  assert.equal(result.completedSets, 2);
  assert.equal(result.lastSet?.id, "bench-2");
});

test("advances to the next exercise after the target is complete", () => {
  const result = getNextWorkoutSet(
    [
      logged("bench-1", "bench", 1),
      logged("bench-2", "bench", 2),
    ],
    [
      planned("bench", "Bench", 1, 2),
      planned("row", "Row", 2, 3),
    ],
  );

  assert.ok(result);
  assert.equal(result.exercise.exercise_id, "row");
  assert.equal(result.setNumber, 1);
  assert.equal(result.lastSet, null);
});

test("returns no action when every planned target is complete", () => {
  const result = getNextWorkoutSet(
    [logged("bench-1", "bench", 1)],
    [planned("bench", "Bench", 1, 1)],
  );

  assert.equal(result, null);
});
