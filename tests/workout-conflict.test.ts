import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  applyWorkoutMutationLocally,
  cacheActiveWorkout,
  emptyWorkoutLocalState,
} from "../src/lib/workoutLocalStore.ts";

const migration = readFileSync(
  "supabase/migrations/20260913160831_add_workout_conflict_tombstones.sql",
  "utf8",
);
const repository = readFileSync(
  "src/repositories/supabaseWorkoutRepository.ts",
  "utf8",
);

test("migration establishes revisioned tombstones and an atomic mutation boundary", () => {
  assert.match(migration, /add column if not exists deleted_at timestamptz/g);
  assert.match(migration, /add column if not exists sync_revision bigint not null default 1/g);
  assert.match(migration, /for update;/);
  assert.match(migration, /current_row\.sync_revision <> p_expected_revision/);
  assert.match(migration, /current_row\.deleted_at is not null/);
  assert.match(migration, /Tombstones win over stale writes/);
  assert.match(migration, /to authenticated/);
  assert.doesNotMatch(migration, /security definer/i);
});

test("repository sends expected revisions through the conflict-safe RPC", () => {
  assert.match(repository, /rpc\("apply_workout_set_mutation"/);
  assert.match(repository, /p_expected_revision: mutation\.expectedRevision \?\? 0/);
  assert.match(repository, /outcome === "conflict"/);
  assert.doesNotMatch(repository, /from\("workout_sets"\)\.upsert/);
  assert.doesNotMatch(repository, /from\("workout_sets"\)[\s\S]{0,80}\.delete\(\)/);
});

test("optimistic local sets advance from the mutation base revision", () => {
  const state = cacheActiveWorkout(emptyWorkoutLocalState("user-1"), {
    workout: {
      completed_at: null,
      id: "workout-1",
      name: "Workout",
      notes: null,
      started_at: "2026-09-13T18:00:00.000Z",
    },
    plannedExercises: [],
    sets: [],
  });
  const updated = applyWorkoutMutationLocally(state, {
    createdAt: "2026-09-13T18:01:00.000Z",
    entityId: "set-1",
    expectedRevision: 4,
    id: "mutation-1",
    kind: "upsert_set",
    lastAttemptAt: null,
    retryCount: 0,
    sessionId: "workout-1",
    set: {
      durationSeconds: null,
      exerciseId: "exercise-1",
      exerciseName: "Squat",
      intensityRpe: null,
      metricUnit: null,
      metricValue: null,
      parentSetId: null,
      performanceType: "reps",
      performedAt: "2026-09-13T18:01:00.000Z",
      reps: 5,
      repsInReserve: 2,
      setNumber: 1,
      setType: "working",
      setVariant: "standard",
      weight: 225,
      weightUnit: "lb",
    },
  });

  assert.equal(updated.activeWorkouts["workout-1"]?.detail.sets[0]?.sync_revision, 5);
});
