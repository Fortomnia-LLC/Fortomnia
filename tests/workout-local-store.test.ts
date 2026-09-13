import assert from "node:assert/strict";
import test from "node:test";

import type { WorkoutSessionDetail } from "../src/domain/workouts.ts";
import {
  acknowledgeWorkoutMutations,
  cacheActiveWorkout,
  createWorkoutLocalStore,
  emptyWorkoutLocalState,
  enqueueWorkoutMutation,
  normalizeWorkoutLocalState,
  recordWorkoutMutationAttempt,
} from "../src/lib/workoutLocalStore.ts";

function workout(id = "workout-1"): WorkoutSessionDetail {
  return {
    workout: {
      completed_at: null,
      id,
      name: "Upper body",
      notes: null,
      started_at: "2026-09-13T18:00:00.000Z",
    },
    plannedExercises: [],
    sets: [],
  };
}

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: async (key: string) => values.get(key) ?? null,
    removeItem: async (key: string) => {
      values.delete(key);
    },
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
    values,
  };
}

const mutation = {
  createdAt: "2026-09-13T18:05:00.000Z",
  entityId: "set-1",
  id: "mutation-1",
  kind: "delete_set" as const,
  lastAttemptAt: null,
  retryCount: 0,
  sessionId: "workout-1",
};

test("persists an active workout and pending mutation across store instances", async () => {
  const storage = memoryStorage();
  const firstProcess = createWorkoutLocalStore(storage);
  let state = cacheActiveWorkout(
    emptyWorkoutLocalState("user-1"),
    workout(),
    "2026-09-13T18:01:00.000Z",
  );
  state = enqueueWorkoutMutation(state, mutation);
  await firstProcess.save(state);

  const restartedProcess = createWorkoutLocalStore(storage);
  const restored = await restartedProcess.load("user-1");
  assert.equal(restored.activeWorkouts["workout-1"]?.detail.workout.name, "Upper body");
  assert.deepEqual(restored.pendingMutations, [mutation]);
});

test("isolates local workout state by user", async () => {
  const storage = memoryStorage();
  const store = createWorkoutLocalStore(storage);
  await store.save(cacheActiveWorkout(emptyWorkoutLocalState("user-1"), workout()));

  assert.deepEqual(await store.load("user-2"), emptyWorkoutLocalState("user-2"));
});

test("deduplicates queued mutations and keeps stable creation order", () => {
  let state = enqueueWorkoutMutation(emptyWorkoutLocalState("user-1"), mutation);
  state = enqueueWorkoutMutation(state, {
    ...mutation,
    entityId: "set-1-updated",
  });
  state = enqueueWorkoutMutation(state, {
    ...mutation,
    createdAt: "2026-09-13T18:04:00.000Z",
    entityId: "workout-1",
    id: "mutation-0",
    kind: "complete_workout",
  });

  assert.deepEqual(
    state.pendingMutations.map(({ id }) => id),
    ["mutation-0", "mutation-1"],
  );
  assert.equal(state.pendingMutations[1]?.entityId, "set-1-updated");
});

test("records retries and removes only acknowledged mutations", () => {
  let state = enqueueWorkoutMutation(emptyWorkoutLocalState("user-1"), mutation);
  state = recordWorkoutMutationAttempt(
    state,
    mutation.id,
    "2026-09-13T18:06:00.000Z",
  );
  assert.equal(state.pendingMutations[0]?.retryCount, 1);
  assert.equal(state.pendingMutations[0]?.lastAttemptAt, "2026-09-13T18:06:00.000Z");

  state = acknowledgeWorkoutMutations(state, [mutation.id]);
  assert.deepEqual(state.pendingMutations, []);
});

test("drops corrupt, cross-user, and completed workout data", () => {
  const completed = workout("completed");
  completed.workout.completed_at = "2026-09-13T19:00:00.000Z";
  const normalized = normalizeWorkoutLocalState(
    {
      activeWorkouts: {
        completed: {
          detail: completed,
          updatedAt: "2026-09-13T19:00:00.000Z",
        },
      },
      pendingMutations: [{ nonsense: true }],
      userId: "another-user",
      version: 1,
    },
    "user-1",
  );

  assert.deepEqual(normalized, emptyWorkoutLocalState("user-1"));
});

test("clears invalid JSON instead of failing app startup", async () => {
  const storage = memoryStorage();
  storage.values.set("fortomnia.workouts.local.v1:user-1", "not-json");
  const state = await createWorkoutLocalStore(storage).load("user-1");

  assert.deepEqual(state, emptyWorkoutLocalState("user-1"));
  assert.equal(storage.values.size, 0);
});
