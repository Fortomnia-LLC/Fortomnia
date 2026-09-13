import { supabase } from "../lib/supabase";
import type {
  CreateWorkoutInput,
  SaveWorkoutSetInput,
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

    if (mutation.kind === "upsert_set" && mutation.set) {
      const { error } = await supabase.from("workout_sets").upsert({
        id: mutation.entityId,
        session_id: mutation.sessionId,
        user_id: userId,
        exercise_id: mutation.set.exerciseId,
        set_number: mutation.set.setNumber,
        reps: mutation.set.reps,
        weight: mutation.set.weight,
        weight_unit: mutation.set.weightUnit,
        reps_in_reserve: mutation.set.repsInReserve,
        duration_seconds: mutation.set.durationSeconds,
        intensity_rpe: mutation.set.intensityRpe,
        metric_unit: mutation.set.metricUnit,
        metric_value: mutation.set.metricValue,
        parent_set_id: mutation.set.parentSetId,
        performance_type: mutation.set.performanceType,
        performed_at: mutation.set.performedAt,
        set_type: mutation.set.setType,
        set_variant: mutation.set.setVariant,
      }, { onConflict: "id" });
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
    operation: "complete" | "delete-set" | "save-set",
  ): Promise<WorkoutMutationResult> {
    await workoutLocalStore.update(
      userId,
      (state) => applyWorkoutMutationLocally(
        enqueueWorkoutMutation(state, mutation),
        mutation,
      ),
    );

    try {
      await this.performMutation(mutation, userId);
      await workoutLocalStore.update(
        userId,
        (state) => acknowledgeWorkoutMutations(state, [mutation.id]),
      );
      return "synced";
    } catch (error) {
      if (this.isRetryable(error)) return "queued";
      await workoutLocalStore.update(userId, (state) => {
        const acknowledged = acknowledgeWorkoutMutations(state, [mutation.id]);
        const activeWorkouts = { ...acknowledged.activeWorkouts };
        delete activeWorkouts[mutation.sessionId];
        return { ...acknowledged, activeWorkouts };
      });
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
    let failure: "attention" | "offline" | null = null;
    let synced = 0;

    for (const mutation of state.pendingMutations) {
      state = await workoutLocalStore.update(
        userId,
        (current) => recordWorkoutMutationAttempt(current, mutation.id),
      );
      try {
        await this.performMutation(mutation, userId);
        state = await workoutLocalStore.update(
          userId,
          (current) => acknowledgeWorkoutMutations(current, [mutation.id]),
        );
        synced += 1;
      } catch (error) {
        failed += 1;
        failure = this.isRetryable(error) ? "offline" : "attention";
        break;
      }
    }

    return { failed, failure, pending: state.pendingMutations.length, synced };
  }

  async saveSet(input: SaveWorkoutSetInput) {
    let state = await workoutLocalStore.load(input.userId);
    let snapshot = state.activeWorkouts[input.sessionId];
    if (!snapshot) {
      await this.getWorkoutDetail(input.sessionId, input.userId);
      state = await workoutLocalStore.load(input.userId);
      snapshot = state.activeWorkouts[input.sessionId];
    }
    if (!snapshot || snapshot.detail.workout.completed_at !== null) {
      throw new WorkoutRepositoryError(
        "Completed workouts cannot be changed.",
        "save-set",
      );
    }

    const existing = input.setId
      ? snapshot.detail.sets.find(({ id }) => id === input.setId)
      : undefined;
    if (input.setId && !existing) {
      throw new WorkoutRepositoryError("The set was not found.", "save-set");
    }
    const setNumber = existing?.set_number ??
      Math.max(0, ...snapshot.detail.sets
        .filter(({ exercise_id }) => exercise_id === input.exerciseId)
        .map(({ set_number }) => set_number)) + 1;
    const setId = input.setId ?? this.createUuid();
    const createdAt = new Date().toISOString();
    return this.queueAndAttempt({
      createdAt,
      entityId: setId,
      id: this.mutationId("upsert-set", setId),
      kind: "upsert_set",
      lastAttemptAt: null,
      retryCount: 0,
      sessionId: input.sessionId,
      set: {
        durationSeconds: input.durationSeconds,
        exerciseId: input.exerciseId,
        exerciseName: input.exerciseName,
        intensityRpe: input.intensityRpe,
        metricUnit: input.metricUnit,
        metricValue: input.metricValue,
        parentSetId: input.parentSetId,
        performanceType: input.performanceType,
        performedAt: createdAt,
        reps: input.reps,
        repsInReserve: input.repsInReserve,
        setNumber,
        setType: input.setType,
        setVariant: input.setVariant,
        weight: input.weight,
        weightUnit: input.weightUnit,
      },
    }, input.userId, "save-set");
  }

  private createUuid(): string {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const value = Math.floor(Math.random() * 16);
      return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
    });
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
    let pendingCompletionAt: string | null = null;
    const state = await workoutLocalStore.update(userId, (current) => {
      let next = cacheActiveWorkout(current, detail);
      for (const mutation of current.pendingMutations) {
        if (mutation.sessionId === workoutId) {
          if (mutation.kind === "complete_workout") {
            pendingCompletionAt = mutation.createdAt;
          }
          next = applyWorkoutMutationLocally(next, mutation);
        }
      }
      return next;
    });
    if (pendingCompletionAt) {
      return {
        ...detail,
        workout: { ...detail.workout, completed_at: pendingCompletionAt },
      };
    }
    return state.activeWorkouts[workoutId]?.detail ?? detail;
  }
}

export const workoutRepository: WorkoutRepository =
  new SupabaseWorkoutRepository();
