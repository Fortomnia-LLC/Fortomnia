import assert from "node:assert/strict";
import test from "node:test";

import {
  beginWorkoutSyncActivity,
  isWorkoutSyncActive,
  subscribeWorkoutSyncActivity,
} from "../src/lib/workoutSyncActivity.ts";

test("keeps sync active until every concurrent mutation finishes", () => {
  const states: boolean[] = [];
  const unsubscribe = subscribeWorkoutSyncActivity("user-1", (active) => {
    states.push(active);
  });
  const endFirst = beginWorkoutSyncActivity("user-1");
  const endSecond = beginWorkoutSyncActivity("user-1");

  endFirst();
  assert.equal(isWorkoutSyncActive("user-1"), true);
  endSecond();
  endSecond();
  assert.equal(isWorkoutSyncActive("user-1"), false);
  assert.deepEqual(states, [true, true, true, false]);
  unsubscribe();
});

test("isolates activity by authenticated user", () => {
  const end = beginWorkoutSyncActivity("user-1");
  assert.equal(isWorkoutSyncActive("user-2"), false);
  end();
});
