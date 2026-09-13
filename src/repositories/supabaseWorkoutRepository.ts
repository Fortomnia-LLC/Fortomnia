import { supabase } from "../lib/supabase";
import type {
  CreateWorkoutInput,
  WorkoutDetail,
  WorkoutSession,
  WorkoutSessionDetail,
} from "../domain/workouts";
import {
  type WorkoutRepository,
  type WorkoutMutationResult,
  WorkoutRepositoryError,
} from "./workoutRepository";
import {
  acknowledgeWorkoutMutations,
  applyWorkoutMutationLocally,
  cacheActiveWorkout,
  enqueueWorkoutMutation,
  recordWorkoutMutationAttempt,
  type PendingWorkoutMutation,
  workoutLocalStore,
} from "../lib/workoutLocalStore";
import {
  mapPlannedExerciseRow,
  mapWorkoutSetRow,
  type PlannedExerciseRow,
  type WorkoutSetRow,
} from "./workoutRowMappers";

class SupabaseWorkoutRepository implements WorkoutRepository {
  private mutationId(kind: string, entityId: string): string {
    return `${kind}:${entityId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  }

  private isRetryable(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? "");
    return /network|fetch|timeout|timed out|offline|connection/i.test(message);
  }

  private async performMutation(
    mutation: PendingWorkoutMutation,
    userId: string,
  ): Promise<void> {
    if (mutation.kind === "complete_workout") {
      const { error } = await supabase
        .from("workout_sessions")
        .update({ completed_at: mutation.createdAt })
        .eq("id", mutation.sessionId)
        .eq("user_id", userId)
        .is("completed_at", null);
      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from("workout_sets")
      .delete()
      .eq("id", mutation.entityId)
      .eq("session_id", mutation.sessionId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  private async queueAndAttempt(
    mutation: PendingWorkoutMutation,
    userId: string,
    operation: "complete" | "delete-set",
  ): Promise<WorkoutMutationResult> {
    const originalState = await workoutLocalStore.load(userId);
    let state = originalState;
    state = applyWorkoutMutationLocally(
      enqueueWorkoutMutation(state, mutation),
      mutation,
    );
    await workoutLocalStore.save(state);

    try {
      await this.performMutation(mutation, userId);
      await workoutLocalStore.save(originalState);
      return "synced";
    } catch (error) {
      if (this.isRetryable(error)) return "queued";
      await workoutLocalStore.save(
        acknowledgeWorkoutMutations(state, [mutation.id]),
      );
      throw new WorkoutRepositoryError(
        error instanceof Error ? error.message : "The workout was not updated.",
        operation,
      );
    }
  }

  async completeWorkout(workoutId: string, userId: string) {
    const createdAt = new Date().toISOString();
    return this.queueAndAttempt(
      {
        createdAt,
        entityId: workoutId,
        id: this.mutationId("complete", workoutId),
        kind: "complete_workout",
        lastAttemptAt: null,
        retryCount: 0,
        sessionId: workoutId,
      },
      userId,
      "complete",
    );
  }

  async deleteSet(setId: string, sessionId: string, userId: string) {
    const createdAt = new Date().toISOString();
    return this.queueAndAttempt(
      {
        createdAt,
        entityId: setId,
        id: this.mutationId("delete-set", setId),
        kind: "delete_set",
        lastAttemptAt: null,
        retryCount: 0,
        sessionId,
      },
      userId,
      "delete-set",
    );
  }

  async syncPendingMutations(userId: string) {
    let state = await workoutLocalStore.load(userId);
    let failed = 0;
    let synced = 0;

    for (const mutation of state.pendingMutations) {
      state = recordWorkoutMutationAttempt(state, mutation.id);
      await workoutLocalStore.save(state);
      try {
        await this.performMutation(mutation, userId);
        state = acknowledgeWorkoutMutations(state, [mutation.id]);
        synced += 1;
      } catch (error) {
        failed += 1;
        break;
      }
      await workoutLocalStore.save(state);
    }

    return { failed, pending: state.pendingMutations.length, synced };
  }

  async createWorkout({ name, userId }: CreateWorkoutInput) {
    const { error } = await supabase.from("workout_sessions").insert({
      name,
      user_id: userId,
    });
    if (error) throw new WorkoutRepositoryError(error.message, "create");
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

  async getWorkoutDetail(workoutId: string, userId: string): Promise<WorkoutSessionDetail> {
    const [workoutResult, setsResult, planResult] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, name, started_at, completed_at, notes")
        .eq("id", workoutId)
        .eq("user_id", userId)
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
        .eq("user_id", userId)
        .order("performed_at"),
      supabase
        .from("workout_session_exercises")
        .select(`
          id, exercise_id, position, superset_group, performance_type,
          target_duration_seconds, target_metric_unit, target_metric_value,
          target_sets, rep_min, rep_max, target_rir, exercises (name)
        `)
        .eq("session_id", workoutId)
        .eq("user_id", userId)
        .order("position"),
    ]);

    if (workoutResult.error || setsResult.error || planResult.error) {
      const cached = (await workoutLocalStore.load(userId)).activeWorkouts[workoutId];
      if (cached) return cached.detail;
      const message = workoutResult.error?.message ?? setsResult.error?.message ?? planResult.error?.message ?? "Unable to load workout.";
      throw new WorkoutRepositoryError(message, "detail");
    }

    const detail = {
      workout: workoutResult.data as WorkoutDetail,
      sets: (setsResult.data as WorkoutSetRow[]).map(mapWorkoutSetRow),
      plannedExercises: (planResult.data as PlannedExerciseRow[]).map(
        mapPlannedExerciseRow,
      ),
    };
    const state = cacheActiveWorkout(await workoutLocalStore.load(userId), detail);
    await workoutLocalStore.save(state);
    return detail;
  }
}

export const workoutRepository: WorkoutRepository =
  new SupabaseWorkoutRepository();
