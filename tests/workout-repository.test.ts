import assert from "node:assert/strict";
import test from "node:test";

import {
  mapPlannedExerciseRow,
  mapWorkoutSetRow,
} from "../src/repositories/workoutRowMappers.ts";
import { WorkoutRepositoryError } from "../src/repositories/workoutRepository.ts";

test("maps database workout sets into stable domain values", () => {
  const set = mapWorkoutSetRow({
    duration_seconds: null,
    intensity_rpe: null,
    metric_unit: null,
    metric_value: "42.5",
    exercise_id: "exercise-1",
    exercises: [{ name: "Bench Press" }],
    id: "set-1",
    parent_set_id: null,
    performance_type: "reps",
    reps: 8,
    reps_in_reserve: 2,
    set_number: 1,
    set_type: "working",
    set_variant: "standard",
    weight: "225.5",
    weight_unit: "lb",
  });

  assert.equal(set.exercise_name, "Bench Press");
  assert.equal(set.metric_value, 42.5);
  assert.equal(set.weight, 225.5);
});

test("keeps repository consumers independent of Supabase relation shape", () => {
  const exercise = mapPlannedExerciseRow({
    exercise_id: "exercise-2",
    exercises: { name: "Split Squat" },
    id: "plan-1",
    performance_type: "reps",
    position: 1,
    rep_max: 12,
    rep_min: 8,
    superset_group: null,
    target_duration_seconds: null,
    target_metric_unit: null,
    target_metric_value: "10",
    target_rir: 2,
    target_sets: 3,
  });

  assert.equal(exercise.exercise_name, "Split Squat");
  assert.equal(exercise.target_metric_value, 10);
});

test("uses a safe fallback when a joined exercise is unavailable", () => {
  const exercise = mapPlannedExerciseRow({
    exercise_id: "missing",
    exercises: null,
    id: "plan-2",
    performance_type: "reps",
    position: 2,
    rep_max: 10,
    rep_min: 6,
    superset_group: null,
    target_duration_seconds: null,
    target_metric_unit: null,
    target_metric_value: null,
    target_rir: null,
    target_sets: 3,
  });

  assert.equal(exercise.exercise_name, "Unknown exercise");
  assert.equal(exercise.target_metric_value, null);
});

test("repository errors preserve the failed operation", () => {
  const error = new WorkoutRepositoryError("Request failed", "detail");
  assert.equal(error.name, "WorkoutRepositoryError");
  assert.equal(error.operation, "detail");
  assert.equal(error.message, "Request failed");
});
