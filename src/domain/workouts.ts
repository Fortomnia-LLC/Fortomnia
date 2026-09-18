import type { MetricUnit, PerformanceType } from "../lib/performanceMetrics";

export type WorkoutSession = {
  completed_at: string | null;
  created_at: string;
  id: string;
  name: string;
  notes: string | null;
  started_at: string;
  training_location_equipment?: string[] | null;
  training_location_id?: string | null;
  training_location_name?: string | null;
  training_location_type?: string | null;
  user_id: string;
};

export type WorkoutDetail = Pick<
  WorkoutSession,
  | "completed_at"
  | "id"
  | "name"
  | "notes"
  | "started_at"
  | "training_location_equipment"
  | "training_location_id"
  | "training_location_name"
  | "training_location_type"
>;

export type LoggedSet = {
  duration_seconds: number | null;
  intensity_rpe?: number | null;
  metric_unit?: MetricUnit | null;
  metric_value?: number | null;
  exercise_id: string;
  exercise_name: string;
  exercise_variant_id?: string | null;
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
  variation_name?: string | null;
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
  clientSetId?: string;
  durationSeconds: number | null;
  exerciseId: string;
  exerciseName: string;
  exerciseVariantId?: string | null;
  exerciseVariationName?: string | null;
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
