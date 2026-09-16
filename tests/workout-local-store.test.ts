import assert from "node:assert/strict";
import test from "node:test";

import type { WorkoutSessionDetail } from "../src/domain/workouts.ts";
import {
  acknowledgeWorkoutMutations,
  applyWorkoutMutationLocally,
  cacheActiveWorkout,
  createWorkoutLocalStore,
  emptyWorkoutLocalState,
  enqueueWorkoutMutation,
  MAX_PENDING_WORKOUT_MUTATIONS,
  normalizeWorkoutLocalState,
  recordWorkoutMutationAttempt,
  WorkoutMutationQueueFullError,
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

test("applies queued set deletion to the cached workout", () => {
  const detail = workout();
  detail.sets = [{
    duration_seconds: null, exercise_id: "exercise-1", exercise_name: "Squat",
    id: "set-1", parent_set_id: null, performance_type: "reps", reps: 5,
    reps_in_reserve: 2, set_number: 1, set_type: "working",
    set_variant: "standard", weight: 225, weight_unit: "lb",
  }];
  const state = cacheActiveWorkout(emptyWorkoutLocalState("user-1"), detail);
  const updated = applyWorkoutMutationLocally(state, mutation);
  assert.deepEqual(updated.activeWorkouts["workout-1"]?.detail.sets, []);
});

test("applies an idempotent set upsert to the cached workout", () => {
  const state = cacheActiveWorkout(emptyWorkoutLocalState("user-1"), workout());
  const upsert = {
    ...mutation,
    entityId: "offline-set-1",
    id: "upsert-1",
    kind: "upsert_set" as const,
    set: {
      durationSeconds: null,
      exerciseId: "exercise-1",
      exerciseName: "Bench Press",
      exerciseVariantId: "variant-1",
      exerciseVariationName: "Medium Grip",
      intensityRpe: null,
      metricUnit: null,
      metricValue: null,
      parentSetId: null,
      performanceType: "reps" as const,
      performedAt: "2026-09-13T18:05:00.000Z",
      reps: 8,
      repsInReserve: 2,
      setNumber: 1,
      setType: "working" as const,
      setVariant: "standard" as const,
      weight: 225,
      weightUnit: "lb" as const,
    },
  };

  const inserted = applyWorkoutMutationLocally(state, upsert);
  const updated = applyWorkoutMutationLocally(inserted, {
    ...upsert,
    set: { ...upsert.set, reps: 9 },
  });
  assert.equal(updated.activeWorkouts["workout-1"]?.detail.sets.length, 1);
  assert.equal(updated.activeWorkouts["workout-1"]?.detail.sets[0]?.reps, 9);
  assert.equal(
    updated.activeWorkouts["workout-1"]?.detail.sets[0]?.exercise_variant_id,
    "variant-1",
  );
  assert.equal(
    updated.activeWorkouts["workout-1"]?.detail.sets[0]?.variation_name,
    "Medium Grip",
  );
});

test("rejects malformed queued set upserts during restore", () => {
  const state = normalizeWorkoutLocalState({
    activeWorkouts: {},
    pendingMutations: [{ ...mutation, kind: "upsert_set", set: { reps: 8 } }],
    userId: "user-1",
    version: 1,
  }, "user-1");

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

test("evicts a cached workout when its latest snapshot is completed", () => {
  let state = cacheActiveWorkout(emptyWorkoutLocalState("user-1"), workout());
  const completed = workout();
  completed.workout.completed_at = "2026-09-13T19:00:00.000Z";

  state = cacheActiveWorkout(state, completed);
  assert.equal(state.activeWorkouts["workout-1"], undefined);
});

test("rejects new mutations when full without dropping queued work", () => {
  let state = emptyWorkoutLocalState("user-1");
  state.pendingMutations = Array.from(
    { length: MAX_PENDING_WORKOUT_MUTATIONS },
    (_, index) => ({
      ...mutation,
      id: `mutation-${index}`,
      createdAt: new Date(Date.UTC(2026, 8, 13, 18, 0, index)).toISOString(),
    }),
  );

  assert.throws(
    () => enqueueWorkoutMutation(state, { ...mutation, id: "overflow" }),
    WorkoutMutationQueueFullError,
  );
  assert.equal(state.pendingMutations.length, MAX_PENDING_WORKOUT_MUTATIONS);
  assert.equal(state.pendingMutations[0]?.id, "mutation-0");
});

test("clears invalid JSON instead of failing app startup", async () => {
  const storage = memoryStorage();
  storage.values.set("fortomnia.workouts.local.v1:user-1", "not-json");
  const state = await createWorkoutLocalStore(storage).load("user-1");

  assert.deepEqual(state, emptyWorkoutLocalState("user-1"));
  assert.equal(storage.values.size, 0);
});

test("serializes concurrent local updates without losing mutations", async () => {
  const storage = memoryStorage();
  const store = createWorkoutLocalStore(storage);
  await Promise.all([
    store.update("user-1", (state) => enqueueWorkoutMutation(state, mutation)),
    store.update("user-1", (state) => enqueueWorkoutMutation(state, {
      ...mutation,
      entityId: "set-2",
      id: "mutation-2",
    })),
  ]);

  const restored = await store.load("user-1");
  assert.deepEqual(
    restored.pendingMutations.map(({ id }) => id),
    ["mutation-1", "mutation-2"],
  );
});
