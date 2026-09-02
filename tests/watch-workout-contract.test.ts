import assert from "node:assert/strict";
import test from "node:test";

import {
  acknowledgeWatchWorkoutActions,
  isWatchWorkoutAction,
  mergeWatchWorkoutActions,
  type WatchWorkoutAction,
} from "../src/lib/watchWorkoutContract.ts";

function action(actionId: string, sequence: number): WatchWorkoutAction {
  return {
    version: 1,
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
  assert.equal(isWatchWorkoutAction({ ...action("bad", 0), version: 2 }), false);
  assert.equal(isWatchWorkoutAction({ ...action("bad", 0), payload: { ...action("bad", 0).payload, reps: null } }), false);
  assert.equal(isWatchWorkoutAction({ ...action("bad", 0), payload: { ...action("bad", 0).payload, rir: 11 } }), false);
  assert.equal(isWatchWorkoutAction({ ...action("bad", 0), payload: { ...action("bad", 0).payload, performanceType: "calories", reps: null, rir: null, metricValue: 10, metricUnit: "meters" } }), false);
});

