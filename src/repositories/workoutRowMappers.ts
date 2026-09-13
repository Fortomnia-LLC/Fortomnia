import type { LoggedSet, PlannedExercise } from "../domain/workouts";

type ExerciseRelation = { name: string } | { name: string }[] | null;

export type WorkoutSetRow = Omit<
  LoggedSet,
  "exercise_name" | "metric_value" | "weight"
> & {
  exercises: ExerciseRelation;
  metric_value?: number | string | null;
  weight: number | string;
};

export type PlannedExerciseRow = Omit<
  PlannedExercise,
  "exercise_name" | "target_metric_value"
> & {
  exercises: ExerciseRelation;
  target_metric_value?: number | string | null;
};

function exerciseName(relation: ExerciseRelation) {
  const exercise = Array.isArray(relation) ? relation[0] : relation;
  return exercise?.name ?? "Unknown exercise";
}

export function mapWorkoutSetRow(row: WorkoutSetRow): LoggedSet {
  const { exercises, ...set } = row;
  return {
    ...set,
    exercise_name: exerciseName(exercises),
    metric_value: set.metric_value == null ? null : Number(set.metric_value),
    weight: Number(set.weight),
  };
}

export function mapPlannedExerciseRow(row: PlannedExerciseRow): PlannedExercise {
  const { exercises, ...exercise } = row;
  return {
    ...exercise,
    exercise_name: exerciseName(exercises),
    target_metric_value:
      exercise.target_metric_value == null
        ? null
        : Number(exercise.target_metric_value),
  };
}
