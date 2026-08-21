import assert from "node:assert/strict";
import test from "node:test";

import type { LoggedSet } from "../src/hooks/useWorkoutSession.ts";
import { groupWorkoutSets } from "../src/lib/workoutSets.ts";

function set(
  id: string,
  exerciseId: string,
  exerciseName: string,
  setNumber: number,
): LoggedSet {
  return {
    exercise_id: exerciseId,
    exercise_name: exerciseName,
    id,
    reps: 8,
    reps_in_reserve: 2,
    set_number: setNumber,
    set_type: "working",
    weight: 100,
    weight_unit: "lb",
  };
}

test("groups interleaved workout sets by exercise", () => {
  const groups = groupWorkoutSets([
    set("bench-1", "bench", "Bench Press", 1),
    set("row-1", "row", "Barbell Row", 2),
    set("bench-2", "bench", "Bench Press", 3),
  ]);

  assert.deepEqual(
    groups.map((group) => ({
      exerciseId: group.exerciseId,
      setIds: group.sets.map((item) => item.id),
    })),
    [
      { exerciseId: "bench", setIds: ["bench-1", "bench-2"] },
      { exerciseId: "row", setIds: ["row-1"] },
    ],
  );
});

test("uses workout-plan order and keeps unplanned exercises afterward", () => {
  const groups = groupWorkoutSets(
    [
      set("curl-1", "curl", "Curl", 3),
      set("bench-2", "bench", "Bench Press", 2),
      set("row-1", "row", "Barbell Row", 1),
      set("bench-1", "bench", "Bench Press", 1),
    ],
    ["bench", "row"],
  );

  assert.deepEqual(
    groups.map((group) => group.exerciseId),
    ["bench", "row", "curl"],
  );
  assert.deepEqual(
    groups[0]?.sets.map((item) => item.id),
    ["bench-1", "bench-2"],
  );
});

test("does not mutate the source set order", () => {
  const sets = [
    set("bench-2", "bench", "Bench Press", 2),
    set("bench-1", "bench", "Bench Press", 1),
  ];

  groupWorkoutSets(sets);

  assert.deepEqual(
    sets.map((item) => item.id),
    ["bench-2", "bench-1"],
  );
});
