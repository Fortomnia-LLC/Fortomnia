import type { MetricUnit, PerformanceType } from "../lib/performanceMetrics";

export type WorkoutSession = {
  completed_at: string | null;
  created_at: string;
  id: string;
  name: string;
  notes: string | null;
  started_at: string;
  user_id: string;
};

export type WorkoutDetail = Pick<
  WorkoutSession,
  "completed_at" | "id" | "name" | "notes" | "started_at"
>;

export type LoggedSet = {
  duration_seconds: number | null;
  intensity_rpe?: number | null;
  metric_unit?: MetricUnit | null;
  metric_value?: number | null;
  exercise_id: string;
  exercise_name: string;
  id: string;
  parent_set_id: string | null;
  performance_type: PerformanceType;
  set_variant: "standard" | "drop";
  reps: number;
  reps_in_reserve: number | null;
  set_number: number;
  set_type: "warmup" | "working";
  sync_revision?: number;
  weight: number;
  weight_unit: "lb" | "kg";
};

export type PlannedExercise = {
  superset_group: string | null;
  performance_type: PerformanceType;
  exercise_id: string;
  exercise_name: string;
  id: string;
  position: number;
  rep_max: number;
  rep_min: number;
  target_duration_seconds: number | null;
  target_metric_unit?: MetricUnit | null;
  target_metric_value?: number | null;
  target_rir: number | null;
  target_sets: number;
};

export type WorkoutSessionDetail = {
  plannedExercises: PlannedExercise[];
  sets: LoggedSet[];
  workout: WorkoutDetail;
};

export type CreateWorkoutInput = {
  name: string;
  userId: string;
};

export type SaveWorkoutSetInput = {
  durationSeconds: number | null;
  exerciseId: string;
  exerciseName: string;
  intensityRpe: number | null;
  metricUnit: MetricUnit | null;
  metricValue: number | null;
  parentSetId: string | null;
  performanceType: PerformanceType;
  reps: number;
  repsInReserve: number | null;
  sessionId: string;
  setId?: string;
  setType: "warmup" | "working";
  setVariant: "standard" | "drop";
  userId: string;
  weight: number;
  weightUnit: "lb" | "kg";
};
