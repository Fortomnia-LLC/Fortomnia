import assert from "node:assert/strict";
import test from "node:test";

import {
  getWorkoutSyncPresentation,
  type WorkoutSyncStatus,
} from "../src/lib/workoutSyncStatus.ts";

test("presents every workout sync status clearly", () => {
  const states: Array<[WorkoutSyncStatus, string, boolean]> = [
    ["synced", "Synced", false],
    ["syncing", "Syncing…", false],
    ["offline", "Saved offline", true],
    ["attention", "Sync needs attention", true],
  ];

  for (const [status, label, canRetry] of states) {
    assert.deepEqual(
      {
        canRetry: getWorkoutSyncPresentation(status, 2).canRetry,
        label: getWorkoutSyncPresentation(status, 2).label,
      },
      { canRetry, label },
    );
  }
});

test("uses singular and plural pending-change copy", () => {
  assert.equal(
    getWorkoutSyncPresentation("offline", 1).detail,
    "1 workout change waiting to sync",
  );
  assert.equal(
    getWorkoutSyncPresentation("offline", 2).detail,
    "2 workout changes waiting to sync",
  );
});
