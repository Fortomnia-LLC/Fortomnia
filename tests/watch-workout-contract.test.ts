import assert from "node:assert/strict";
import test from "node:test";

import {
  acknowledgeWatchWorkoutActions,
  buildWatchWorkoutSnapshot,
  isWatchWorkoutAction,
  mergeWatchWorkoutActions,
  WATCH_WORKOUT_CONTRACT_VERSION,
  type WatchWorkoutAction,
} from "../src/lib/watchWorkoutContract.ts";

function action(actionId: string, sequence: number): WatchWorkoutAction {
  return {
    version: WATCH_WORKOUT_CONTRACT_VERSION,
    actionId,
    sessionId: "session-1",
    createdAt: `2026-09-02T20:00:${String(sequence).padStart(2, "0")}.000Z`,
    sequence,
    kind: "log_set",
    payload: {
      exerciseId: "exercise-1",
      setNumber: sequence + 1,
      performanceType: "reps",
      reps: 10,
      weight: 100,
      weightUnit: "lb",
      rir: 2,
      durationSeconds: null,
      metricValue: null,
      metricUnit: null,
    },
  };
}

test("merges offline watch actions once in stable sequence order", () => {
  assert.deepEqual(
    mergeWatchWorkoutActions([action("a", 0)], [action("b", 1), action("a", 0)]).map(({ actionId }) => actionId),
    ["a", "b"],
  );
});

test("acknowledges only actions confirmed by the phone", () => {
  assert.deepEqual(
    acknowledgeWatchWorkoutActions([action("a", 0), action("b", 1)], ["a"]).map(({ actionId }) => actionId),
    ["b"],
  );
});

test("rejects malformed or semantically inconsistent set actions", () => {
  assert.equal(isWatchWorkoutAction(action("valid", 0)), true);
  assert.equal(isWatchWorkoutAction({ ...action("bad", 0), version: 3 }), false);
  assert.equal(isWatchWorkoutAction({ ...action("bad", 0), payload: { ...action("bad", 0).payload, reps: null } }), false);
  assert.equal(isWatchWorkoutAction({ ...action("bad", 0), payload: { ...action("bad", 0).payload, rir: 11 } }), false);
  assert.equal(isWatchWorkoutAction({ ...action("bad", 0), payload: { ...action("bad", 0).payload, performanceType: "calories", reps: null, rir: null, metricValue: 10, metricUnit: "meters" } }), false);
});

test("phone snapshot tells the watch the current exercise and set counts", () => {
  const exercises = [
    {
      exercise_id: "bench",
      exercise_name: "Bench Press",
      id: "planned-bench",
      performance_type: "reps" as const,
      position: 1,
      rep_max: 10,
      rep_min: 8,
      superset_group: null,
      target_duration_seconds: null,
      target_metric_unit: null,
      target_metric_value: null,
      target_rir: 2,
      target_sets: 2,
    },
    {
      exercise_id: "row",
      exercise_name: "Row",
      id: "planned-row",
      performance_type: "reps" as const,
      position: 2,
      rep_max: 12,
      rep_min: 10,
      superset_group: null,
      target_duration_seconds: null,
      target_metric_unit: null,
      target_metric_value: null,
      target_rir: 2,
      target_sets: 3,
    },
  ];
  const sets = [1, 2].map((setNumber) => ({
    duration_seconds: null,
    exercise_id: "bench",
    exercise_name: "Bench Press",
    id: `set-${setNumber}`,
    metric_unit: null,
    metric_value: null,
    parent_set_id: null,
    performance_type: "reps" as const,
    reps: 8,
    reps_in_reserve: 2,
    set_number: setNumber,
    set_type: "working" as const,
    set_variant: "standard" as const,
    weight: 135,
    weight_unit: "lb" as const,
  }));
  const snapshot = buildWatchWorkoutSnapshot(
    {
      completed_at: null,
      id: "workout-1",
      name: "Push Pull",
      notes: null,
      started_at: "2026-09-15T12:00:00.000Z",
    },
    exercises,
    sets,
  );

  assert.equal(snapshot.version, WATCH_WORKOUT_CONTRACT_VERSION);
  assert.equal(snapshot.currentExerciseId, "row");
  assert.deepEqual(snapshot.completedSetsByExercise, { bench: 2 });
  assert.equal(snapshot.restEndsAt, null);
});

test("phone snapshot carries the active rest deadline to the watch", () => {
  const endsAt = Date.parse("2026-09-15T12:02:00.000Z");
  const snapshot = buildWatchWorkoutSnapshot(
    {
      completed_at: null,
      id: "workout-1",
      name: "Push Pull",
      notes: null,
      started_at: "2026-09-15T12:00:00.000Z",
    },
    [],
    [],
    endsAt,
  );

  assert.equal(snapshot.restEndsAt, "2026-09-15T12:02:00.000Z");
});
