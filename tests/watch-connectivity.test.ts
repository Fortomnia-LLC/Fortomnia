import assert from "node:assert/strict";
import test from "node:test";

import {
  acknowledgeProcessedWatchActions,
  parseWatchActions,
  transferWorkoutSnapshot,
  type WatchConnectivityAdapter,
} from "../src/lib/watchConnectivity.ts";
import type { WatchWorkoutAction, WatchWorkoutSnapshot } from "../src/lib/watchWorkoutContract.ts";

function action(actionId: string): WatchWorkoutAction {
  return {
    version: 1,
    actionId,
    sessionId: "session-1",
    createdAt: "2026-09-03T12:00:00.000Z",
    sequence: 0,
    kind: "log_set",
    payload: {
      exerciseId: "exercise-1", setNumber: 1, performanceType: "reps",
      reps: 8, weight: 225, weightUnit: "lb", rir: 2,
      durationSeconds: null, metricValue: null, metricUnit: null,
    },
  };
}

function adapter() {
  const calls = { snapshots: [] as string[], acknowledgements: [] as string[][] };
  const value: WatchConnectivityAdapter = {
    async sendWorkoutSnapshot(snapshotJson) {
      calls.snapshots.push(snapshotJson);
      return { supported: true, activated: true, paired: true, appInstalled: true, reachable: false };
    },
    async acknowledgeActions(ids) { calls.acknowledgements.push(ids); },
  };
  return { calls, value };
}

test("serializes the versioned workout snapshot for the native transport", async () => {
  const mock = adapter();
  const snapshot: WatchWorkoutSnapshot = {
    version: 1, sessionId: "session-1", name: "Push", startedAt: "2026-09-03T12:00:00.000Z", exercises: [],
  };
  const state = await transferWorkoutSnapshot(mock.value, snapshot);
  assert.deepEqual(JSON.parse(mock.calls.snapshots[0]), snapshot);
  assert.equal(state.reachable, false);
});

test("keeps only contract-valid actions received from the watch", () => {
  assert.deepEqual(parseWatchActions(JSON.stringify([action("valid"), { nope: true }])).map(x => x.actionId), ["valid"]);
  assert.deepEqual(parseWatchActions("not json"), []);
  assert.deepEqual(parseWatchActions(JSON.stringify({})), []);
});

test("deduplicates acknowledgements and skips empty acknowledgement transfers", async () => {
  const mock = adapter();
  await acknowledgeProcessedWatchActions(mock.value, [action("a"), action("a"), action("b")]);
  await acknowledgeProcessedWatchActions(mock.value, []);
  assert.deepEqual(mock.calls.acknowledgements, [["a", "b"]]);
});
