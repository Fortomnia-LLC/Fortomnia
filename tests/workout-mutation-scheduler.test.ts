import assert from "node:assert/strict";
import test from "node:test";

import { createWorkoutMutationScheduler } from "../src/lib/workoutMutationScheduler.ts";

test("serializes workout mutations for one authenticated user", async () => {
  const scheduler = createWorkoutMutationScheduler();
  const events: string[] = [];
  let releaseFirst: (() => void) | undefined;
  let markFirstStarted: (() => void) | undefined;
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const firstStarted = new Promise<void>((resolve) => {
    markFirstStarted = resolve;
  });
  const first = scheduler.schedule("user-1", async () => {
    events.push("first:start");
    markFirstStarted?.();
    await firstGate;
    events.push("first:end");
  });
  const second = scheduler.schedule("user-1", async () => {
    events.push("second:start");
  });

  await firstStarted;
  assert.deepEqual(events, ["first:start"]);
  releaseFirst?.();
  await Promise.all([first, second]);
  assert.deepEqual(events, ["first:start", "first:end", "second:start"]);
});

test("continues the mutation queue after an earlier request fails", async () => {
  const scheduler = createWorkoutMutationScheduler();
  const events: string[] = [];
  const failed = scheduler.schedule("user-1", async () => {
    events.push("failed");
    throw new Error("offline");
  });
  const recovered = scheduler.schedule("user-1", async () => {
    events.push("recovered");
  });

  await assert.rejects(failed);
  await recovered;
  assert.deepEqual(events, ["failed", "recovered"]);
});

test("allows different users to sync independently", async () => {
  const scheduler = createWorkoutMutationScheduler();
  const events: string[] = [];
  let releaseFirst: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const firstUser = scheduler.schedule("user-1", async () => gate);
  const secondUser = scheduler.schedule("user-2", async () => {
    events.push("user-2");
  });

  await secondUser;
  assert.deepEqual(events, ["user-2"]);
  releaseFirst?.();
  await firstUser;
});
