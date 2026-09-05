import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import type {
  PlannedExercise,
  WorkoutDetail,
} from "./useWorkoutSession";
import {
  acknowledgeProcessedWatchActions,
  parseWatchActions,
  transferWorkoutSnapshot,
} from "../lib/watchConnectivity";
import {
  WATCH_WORKOUT_CONTRACT_VERSION,
  type WatchWorkoutAction,
  type WatchWorkoutSnapshot,
} from "../lib/watchWorkoutContract";
import { supabase } from "../lib/supabase";

type WatchWorkoutSyncOptions = {
  plannedExercises: PlannedExercise[];
  refreshWorkout(): Promise<void>;
  userId: string | undefined;
  workout: WorkoutDetail | null;
};

function buildSnapshot(
  workout: WorkoutDetail,
  plannedExercises: PlannedExercise[],
): WatchWorkoutSnapshot {
  return {
    version: WATCH_WORKOUT_CONTRACT_VERSION,
    sessionId: workout.id,
    name: workout.name,
    startedAt: workout.started_at,
    exercises: plannedExercises.map((exercise) => ({
      exerciseId: exercise.exercise_id,
      name: exercise.exercise_name,
      performanceType: exercise.performance_type,
      position: exercise.position,
      repMin: exercise.rep_min,
      repMax: exercise.rep_max,
      targetDurationSeconds: exercise.target_duration_seconds,
      targetMetricValue: exercise.target_metric_value ?? null,
      targetMetricUnit: exercise.target_metric_unit ?? null,
      targetRir: exercise.target_rir,
      targetSets: exercise.target_sets,
    })),
  };
}

function watchActionToSet(action: WatchWorkoutAction, userId: string) {
  return {
    id: action.actionId,
    duration_seconds: action.payload.durationSeconds,
    exercise_id: action.payload.exerciseId,
    metric_unit: action.payload.metricUnit,
    metric_value: action.payload.metricValue,
    parent_set_id: null,
    performance_type: action.payload.performanceType,
    performed_at: action.createdAt,
    reps: action.payload.reps ?? 0,
    reps_in_reserve: action.payload.rir,
    session_id: action.sessionId,
    set_number: action.payload.setNumber,
    set_type: "working" as const,
    set_variant: "standard" as const,
    user_id: userId,
    weight: action.payload.weight,
    weight_unit: action.payload.weightUnit,
  };
}

export function useWatchWorkoutSync({
  plannedExercises,
  refreshWorkout,
  userId,
  workout,
}: WatchWorkoutSyncOptions): void {
  const processingRef = useRef(Promise.resolve());

  useEffect(() => {
    if (Platform.OS !== "ios" || !userId || !workout) {
      return;
    }

    const activeWorkout = workout;
    let disposed = false;
    let subscription: { remove(): void } | undefined;

    void import("../../modules/fortomnia-watch").then(async ({ default: FortomniaWatch }) => {
    const processActions = async (actionsJson: string) => {
      const actions = parseWatchActions(actionsJson).filter(
        (action) => action.sessionId === activeWorkout.id,
      );
      if (actions.length === 0) return;

      const actionIds = actions.map((action) => action.actionId);
      const { data: existing, error: lookupError } = await supabase
        .from("workout_sets")
        .select("id")
        .eq("session_id", activeWorkout.id)
        .eq("user_id", userId)
        .in("id", actionIds);

      if (lookupError) return;

      const existingIds = new Set((existing ?? []).map(({ id }) => id));
      const missing = actions.filter(({ actionId }) => !existingIds.has(actionId));

      if (missing.length > 0) {
        const { error: insertError } = await supabase
          .from("workout_sets")
          .insert(missing.map((action) => watchActionToSet(action, userId)));
        if (insertError) return;
      }

      await acknowledgeProcessedWatchActions(FortomniaWatch, actions);
      if (!disposed) await refreshWorkout();
    };

    const enqueueActions = (actionsJson: string) => {
      processingRef.current = processingRef.current
        .then(() => processActions(actionsJson))
        .catch(() => undefined);
    };

    subscription = FortomniaWatch.addListener(
      "onWatchActions",
      ({ actionsJson }) => enqueueActions(actionsJson),
    );

    if (activeWorkout.completed_at) {
      await FortomniaWatch.clearWorkout();
      return;
    }

    void FortomniaWatch.activate().then(() => {
      const pending = FortomniaWatch.getPendingActions();
      if (pending) enqueueActions(pending);
    });

    void transferWorkoutSnapshot(
      FortomniaWatch,
      buildSnapshot(activeWorkout, plannedExercises),
    );
    }).catch((error: unknown) => {
      console.warn(
        "Apple Watch sync unavailable:",
        error instanceof Error ? error.message : "Unknown error",
      );
    });

    return () => {
      disposed = true;
      subscription?.remove();
    };
  }, [plannedExercises, refreshWorkout, userId, workout]);
}
