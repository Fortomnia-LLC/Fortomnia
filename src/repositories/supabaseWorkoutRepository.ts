import { supabase } from "../lib/supabase";
import type {
  CreateWorkoutInput,
  WorkoutDetail,
  WorkoutSession,
  WorkoutSessionDetail,
} from "../domain/workouts";
import {
  type WorkoutRepository,
  WorkoutRepositoryError,
} from "./workoutRepository";
import {
  mapPlannedExerciseRow,
  mapWorkoutSetRow,
  type PlannedExerciseRow,
  type WorkoutSetRow,
} from "./workoutRowMappers";

class SupabaseWorkoutRepository implements WorkoutRepository {
  async completeWorkout(workoutId: string, userId: string) {
    const { data, error } = await supabase
      .from("workout_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", workoutId)
      .eq("user_id", userId)
      .is("completed_at", null)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      throw new WorkoutRepositoryError(
        error?.message ?? "The workout was not updated.",
        "complete",
      );
    }
  }

  async createWorkout({ name, userId }: CreateWorkoutInput) {
    const { error } = await supabase.from("workout_sessions").insert({
      name,
      user_id: userId,
    });
    if (error) throw new WorkoutRepositoryError(error.message, "create");
  }

  async deleteSet(setId: string, userId: string) {
    const { data, error } = await supabase
      .from("workout_sets")
      .delete()
      .eq("id", setId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      throw new WorkoutRepositoryError(
        error?.message ?? "The set was not deleted.",
        "delete-set",
      );
    }
  }

  async listRecentWorkouts(userId: string, limit = 5) {
    const { data, error } = await supabase
      .from("workout_sessions")
      .select("id, user_id, name, started_at, completed_at, notes, created_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw new WorkoutRepositoryError(error.message, "list");
    return (data ?? []) as WorkoutSession[];
  }

  async getWorkoutDetail(workoutId: string): Promise<WorkoutSessionDetail> {
    const [workoutResult, setsResult, planResult] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, name, started_at, completed_at, notes")
        .eq("id", workoutId)
        .single(),
      supabase
        .from("workout_sets")
        .select(`
          id, exercise_id, duration_seconds, intensity_rpe, metric_unit,
          metric_value, parent_set_id, performance_type, set_number,
          set_variant, set_type, reps, weight, weight_unit, reps_in_reserve,
          exercises (name)
        `)
        .eq("session_id", workoutId)
        .order("performed_at"),
      supabase
        .from("workout_session_exercises")
        .select(`
          id, exercise_id, position, superset_group, performance_type,
          target_duration_seconds, target_metric_unit, target_metric_value,
          target_sets, rep_min, rep_max, target_rir, exercises (name)
        `)
        .eq("session_id", workoutId)
        .order("position"),
    ]);

    if (workoutResult.error) {
      throw new WorkoutRepositoryError(workoutResult.error.message, "detail");
    }
    if (setsResult.error) {
      throw new WorkoutRepositoryError(setsResult.error.message, "detail");
    }
    if (planResult.error) {
      throw new WorkoutRepositoryError(planResult.error.message, "detail");
    }

    return {
      workout: workoutResult.data as WorkoutDetail,
      sets: (setsResult.data as WorkoutSetRow[]).map(mapWorkoutSetRow),
      plannedExercises: (planResult.data as PlannedExerciseRow[]).map(
        mapPlannedExerciseRow,
      ),
    };
  }
}

export const workoutRepository: WorkoutRepository =
  new SupabaseWorkoutRepository();
